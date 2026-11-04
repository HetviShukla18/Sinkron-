const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const { NextResponse } = require('next/server');

const compiled = ts.transpileModule(fs.readFileSync('app/api/enquiry/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const validLead = { name: 'Website Test', phone: '1234567890', email: 'test@example.com' };
const storageEnv = { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example', SUPABASE_SERVICE_ROLE_KEY: 'test' };
const emailEnv = { RESEND_API_KEY: 'email-secret', ENQUIRY_EMAIL: 'recipient@example.com', RESEND_FROM_EMAIL: 'sender@example.com' };
const whatsappEnv = { WHATSAPP_ACCESS_TOKEN: 'meta-secret', WHATSAPP_PHONE_NUMBER_ID: '123456789012345', WHATSAPP_RECIPIENT_NUMBER: '919876543210', WHATSAPP_API_VERSION: 'v23.0', WHATSAPP_TEMPLATE_NAME: 'sinkron_website_enquiry', WHATSAPP_TEMPLATE_LANGUAGE: 'en_US' };
const messageModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/enquiry-message.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: messageModule.exports, module: messageModule });
const telegramCompiled = ts.transpileModule(fs.readFileSync('lib/telegram.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const whatsappCompiled = ts.transpileModule(fs.readFileSync('lib/whatsapp.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const payloadModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/enquiry-payload.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: payloadModule.exports, module: payloadModule, TextDecoder });

function loadRoute({ env = {}, fetch = async () => { throw new Error('Unexpected network request'); }, storageError = null, updateError = null, clock = Date, realStorageClient = false } = {}) {
  const inserts = [], updates = [], errors = [], events = [];
  const testModule = { exports: {} };
  const telegramModule = { exports: {} };
  const whatsappModule = { exports: {} };
  const safeConsole = { ...console, error: (...args) => errors.push(args) };
  vm.runInNewContext(telegramCompiled, {
    exports: telegramModule.exports, module: telegramModule, console: safeConsole, AbortSignal, fetch,
    require: name => name === '@/lib/enquiry-message' ? messageModule.exports : require(name),
  });
  vm.runInNewContext(whatsappCompiled, {
    exports: whatsappModule.exports, module: whatsappModule, console: safeConsole, AbortSignal, fetch, process: { env },
    require: name => name === 'server-only' ? {} : name === '@/lib/enquiry-message' ? messageModule.exports : require(name),
  });
  vm.runInNewContext(compiled, {
    exports: testModule.exports, module: testModule, console: safeConsole, AbortSignal, Date: clock,
    process: { env }, fetch,
    require(name) {
      if (name === 'next/server') return { NextResponse };
      if (name === '@/lib/enquiry-payload') return payloadModule.exports;
      if (name === '@/lib/telegram') return telegramModule.exports;
      if (name === '@/lib/whatsapp') return whatsappModule.exports;
      if (name === '@/lib/enquiry-message') return messageModule.exports;
      if (name === '@supabase/supabase-js' && !realStorageClient) return { createClient: () => ({ from: () => ({
        insert(data) { inserts.push(data); events.push('save'); return { select: () => ({ single: async () => ({ data: { id: 42 }, error: storageError }) }) }; },
        update(data) { updates.push(data); events.push('status'); return { eq: () => ({ abortSignal: async () => ({ error: typeof updateError === 'function' ? updateError(data) : updateError }) }) }; },
      }) }) };
      return require(name);
    },
  });
  return { ...testModule.exports, ...telegramModule.exports, inserts, updates, errors, events };
}

function request(data = validLead) {
  return new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

test('invalid input is rejected before contacting services', async () => {
  const route = loadRoute();
  assert.equal((await route.POST(request({ name: '' }))).status, 400);
  assert.equal(route.inserts.length, 0);
});

test('an unconfigured form reports unavailable instead of losing a lead silently', async () => {
  const route = loadRoute();
  const response = await route.POST(request());
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /phone or WhatsApp/);
  assert.match(route.errors[0][0], /not configured.*\.env\.local/);
});

test('the installed Supabase client can save on Node 20 without a native WebSocket', async () => {
  const calls = [];
  const route = loadRoute({
    realStorageClient: true,
    env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example', SUPABASE_SERVICE_ROLE_KEY: 'server-test-key' },
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json(options.method === 'POST' ? { id: 42 } : null);
    },
  });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).enquiryId, 42);
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[0].url).pathname, '/rest/v1/enquiries');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(new Headers(calls[0].options.headers).get('apikey'), 'server-test-key');
  assert.equal(JSON.parse(calls[0].options.body).name, validLead.name);
  assert.equal(calls[1].options.method, 'PATCH');
});

test('an enquiry is saved, then emailed, then sent to Telegram before success is returned', async () => {
  const pending = [], messages = [];
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    fetch: (url, options) => new Promise(resolve => {
      route.events.push(url.includes('resend') ? 'email' : 'telegram');
      assert.ok(options.signal instanceof AbortSignal);
      messages.push(JSON.parse(options.body));
      pending.push(() => resolve(Response.json(url.includes('resend') ? { id: 'email-id' } : { ok: true, result: { message_id: 1 } })));
    }),
  });
  let returned = false;
  const result = route.POST(request()).then(response => { returned = true; return response; });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(route.events, ['save', 'email']);
  assert.equal(returned, false);
  pending[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(route.events, ['save', 'email', 'telegram']);
  assert.equal(returned, false);
  pending[1]();
  const response = await result;
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.equal(JSON.parse(body).enquiryId, 42);
  assert.doesNotMatch(body, /bot-secret|email-secret|1234/);
  assert.equal(route.inserts.length, 1);
  assert.deepEqual(route.events, ['save', 'email', 'telegram', 'status']);
  assert.equal(route.updates[0].email_status, 'sent');
  assert.equal(route.updates[0].telegram_status, 'sent');
  assert.equal(messages[0].from, emailEnv.RESEND_FROM_EMAIL);
  assert.equal(messages[0].to[0], emailEnv.ENQUIRY_EMAIL);
  assert.equal(messages[0].text, messages[1].text.replace(/^🔔 /, ''));
});

test('all channels finish in save, email, Telegram, WhatsApp, status order before success', async () => {
  const pending = [], messages = [];
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, ...whatsappEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    fetch: (url, options) => new Promise(resolve => {
      const channel = url.includes('resend') ? 'email' : url.includes('telegram') ? 'telegram' : 'whatsapp';
      route.events.push(channel);
      messages.push({ channel, body: JSON.parse(options.body) });
      pending.push(() => resolve(Response.json(channel === 'email' ? { id: 'email-id' } : channel === 'telegram' ? { ok: true, result: { message_id: 1 } } : { messaging_product: 'whatsapp', messages: [{ id: 'wamid.test' }] })));
    }),
  });
  let returned = false;
  const result = route.POST(request({ ...validLead, company: 'Example Company', message: 'Please quote.' })).then(response => { returned = true; return response; });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(route.events, ['save', 'email']);
  assert.equal(returned, false);
  pending[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(route.events, ['save', 'email', 'telegram']);
  assert.equal(returned, false);
  pending[1]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(route.events, ['save', 'email', 'telegram', 'whatsapp']);
  assert.equal(returned, false);
  pending[2]();
  const response = await result;
  assert.equal(response.status, 200);
  assert.deepEqual(route.events, ['save', 'email', 'telegram', 'whatsapp', 'status']);
  assert.equal(route.updates[0].email_status, 'sent');
  assert.equal(route.updates[0].telegram_status, 'sent');
  assert.equal(route.updates[0].whatsapp_status, 'sent');
  assert.equal(route.inserts.length, 1);
  assert.equal(messages[2].body.to, whatsappEnv.WHATSAPP_RECIPIENT_NUMBER);
  assert.equal(messages[2].body.type, 'template');
  assert.match(messages[2].body.template.components[0].parameters[3].text, /Company: Example Company.*Message: Please quote\./);
  assert.doesNotMatch(await response.text(), /meta-secret|bot-secret|email-secret|123456789012345|919876543210|WHATSAPP/);
});

test('WhatsApp failure preserves the saved enquiry and successful email and Telegram notifications', async () => {
  const calls = [];
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, ...whatsappEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    fetch: async url => {
      calls.push(url);
      if (url.includes('resend')) return Response.json({ id: 'email-id' });
      if (url.includes('telegram')) return Response.json({ ok: true, result: { message_id: 1 } });
      throw new Error('Bearer meta-secret private provider detail');
    },
  });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal(calls.length, 3);
  assert.equal(route.inserts.length, 1);
  assert.equal(route.updates[0].email_status, 'sent');
  assert.equal(route.updates[0].telegram_status, 'sent');
  assert.equal(route.updates[0].whatsapp_status, 'failed');
  assert.doesNotMatch(JSON.stringify(route.errors) + await response.text(), /meta-secret|private provider/);
});

test('email and Telegram failures do not prevent the WhatsApp attempt or saved-lead success', async () => {
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, ...whatsappEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    fetch: async url => {
      if (url.includes('graph.facebook.com')) return Response.json({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.test' }] });
      throw new Error('email-secret bot-secret private response');
    },
  });
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(route.inserts.length, 1);
  assert.equal(route.updates[0].email_status, 'failed');
  assert.equal(route.updates[0].telegram_status, 'failed');
  assert.equal(route.updates[0].whatsapp_status, 'sent');
  assert.doesNotMatch(JSON.stringify(route.errors), /email-secret|bot-secret|private response/);
});

test('missing WhatsApp settings are tracked as skipped and never block existing services', async () => {
  const route = loadRoute({ env: storageEnv });
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(route.updates[0].whatsapp_status, 'skipped');
  assert.equal(route.errors.length, 0);
});

test('a pending WhatsApp schema migration preserves one saved lead and existing notification statuses', async () => {
  const route = loadRoute({
    env: storageEnv,
    updateError: data => 'whatsapp_status' in data ? { code: 'PGRST204', message: "Could not find the 'whatsapp_status' column" } : null,
  });
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(route.inserts.length, 1);
  assert.equal('whatsapp_status' in route.inserts[0], false);
  assert.equal(route.updates.length, 2);
  assert.equal('whatsapp_status' in route.updates[1], false);
  assert.equal(route.updates[1].email_status, 'not_configured');
  assert.equal(route.updates[1].telegram_status, 'not_configured');
  assert.match(route.errors[0][0], /Run supabase.sql/);
});

test('Supabase insert failure prevents all external notifications including WhatsApp', async () => {
  let calls = 0;
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, ...whatsappEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    storageError: { message: 'private storage detail' },
    fetch: async () => { calls++; throw new Error('Must not send'); },
  });
  assert.equal((await route.POST(request())).status, 500);
  assert.equal(calls, 0);
  assert.equal(route.updates.length, 0);
});

test('Telegram and WhatsApp share a bounded deadline inside the unchanged form timeout', async () => {
  const timeouts = [];
  let elapsed = 0;
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, ...whatsappEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    clock: { now: () => elapsed },
    fetch: async url => {
      if (url.includes('resend')) { elapsed = 8_000; return Response.json({ id: 'email-id' }); }
      if (url.includes('telegram')) { elapsed = 9_500; return Response.json({ ok: true, result: { message_id: 1 } }); }
      elapsed = 11_000;
      return Response.json({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.test' }] });
    },
  });
  const originalTimeout = AbortSignal.timeout;
  AbortSignal.timeout = ms => { timeouts.push(ms); return originalTimeout(ms); };
  try { assert.equal((await route.POST(request())).status, 200); }
  finally { AbortSignal.timeout = originalTimeout; }
  assert.deepEqual(timeouts, [3_000, 1_500, 1_500, 2_000]);
  assert.equal(route.updates[0].whatsapp_status, 'sent');
});

test('storage failure retains an error response without sending notifications', async () => {
  const route = loadRoute({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example', SUPABASE_SERVICE_ROLE_KEY: 'test' }, storageError: { message: 'private database detail' } });
  const response = await route.POST(request());
  assert.equal(response.status, 500);
  assert.doesNotMatch(JSON.stringify(await response.json()), /private database detail/);
  assert.equal(route.updates.length, 0);
});

test('Telegram is still attempted when email fails after the enquiry is saved', async () => {
  const calls = [];
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, TELEGRAM_BOT_TOKEN: 'test', TELEGRAM_CHAT_ID: '1234' },
    fetch: async url => {
      calls.push(url);
      return Response.json(url.includes('resend') ? { error: 'failed' } : { ok: true, result: { message_id: 1 } }, { status: url.includes('resend') ? 422 : 200 });
    },
  });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(route.updates[0].email_status, 'failed');
  assert.equal(route.updates[0].telegram_status, 'sent');
  assert.match(route.errors[0][0], /Email notification failed/);
});

test('email and Telegram failures preserve the saved enquiry without leaking errors', async () => {
  const route = loadRoute({
    env: { ...storageEnv, ...emailEnv, TELEGRAM_BOT_TOKEN: 'bot-secret', TELEGRAM_CHAT_ID: '1234' },
    fetch: async () => { throw new Error('email-secret bot-secret 1234 private provider response'); },
  });
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(route.inserts.length, 1);
  assert.equal(route.updates[0].email_status, 'failed');
  assert.equal(route.updates[0].telegram_status, 'failed');
  assert.equal(route.errors.length, 2);
  assert.doesNotMatch(JSON.stringify(route.errors), /email-secret|bot-secret|1234|private provider/);
});

test('no notifications are sent until Supabase storage is configured', async () => {
  const route = loadRoute({ env: { RESEND_API_KEY: 'test', ENQUIRY_EMAIL: 'test@example.com' }, fetch: async () => Response.json({ message: 'Invalid API key' }, { status: 401 }) });
  assert.equal((await route.POST(request())).status, 503);
});

test('Telegram failure keeps the saved enquiry and logs no secret-bearing error details', async () => {
  const route = loadRoute({
    env: { ...storageEnv, TELEGRAM_BOT_TOKEN: 'secret-bot-token', TELEGRAM_CHAT_ID: '1234' },
    fetch: async () => { throw new Error('Private fetch URL https://api.telegram.org/botsecret-bot-token/sendMessage'); },
  });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.equal(route.inserts.length, 1);
  assert.equal(route.updates[0].telegram_status, 'failed');
  assert.match(route.errors[0][0], /Telegram notification failed/);
  assert.doesNotMatch(JSON.stringify(route.errors), /secret-bot-token|1234|https:/);
  assert.doesNotMatch(await response.text(), /secret-bot-token|1234/);
});

test('Telegram API errors and malformed confirmations are treated as failed notifications', async () => {
  for (const result of [{ ok: false, description: 'private provider detail' }, { ok: true }]) {
    const route = loadRoute({
      env: { ...storageEnv, TELEGRAM_BOT_TOKEN: 'secret', TELEGRAM_CHAT_ID: '1234' },
      fetch: async () => Response.json(result),
    });
    assert.equal((await route.POST(request())).status, 200);
    assert.equal(route.updates[0].telegram_status, 'failed');
    assert.doesNotMatch(JSON.stringify(route.errors), /private provider detail/);
  }
});

test('Telegram logs actionable safe reasons without copying provider descriptions', async () => {
  for (const [code, reason] of [[401, /token was rejected/], [403, /press Start/], [400, /configured private chat/], [429, /rate limiting/], [503, /temporarily unavailable/]]) {
    const route = loadRoute({
      env: { ...storageEnv, TELEGRAM_BOT_TOKEN: 'secret-bot-token', TELEGRAM_CHAT_ID: '1234' },
      fetch: async () => Response.json({ ok: false, error_code: code, description: 'secret-bot-token 1234 private response' }, { status: code }),
    });
    assert.equal((await route.POST(request())).status, 200);
    assert.match(route.errors[0][0], reason);
    assert.doesNotMatch(JSON.stringify(route.errors), /secret-bot-token|1234|private response/);
  }
  const route = loadRoute({ fetch: async () => { throw new DOMException('private URL containing secret-bot-token', 'TimeoutError'); } });
  assert.equal(await route.sendTelegramEnquiry(validLead, 'secret-bot-token', '1234'), 'failed');
  assert.match(route.errors[0][0], /timed out/);
  assert.doesNotMatch(JSON.stringify(route.errors), /secret-bot-token|1234|private URL/);
});

test('Telegram uses the configured notification timeout without a retry that could duplicate messages', async () => {
  const timeouts = [], calls = [];
  const route = loadRoute({ fetch: async url => {
    calls.push(url);
    return Response.json({ ok: true, result: { message_id: 1 } });
  } });
  const originalTimeout = AbortSignal.timeout;
  AbortSignal.timeout = milliseconds => { timeouts.push(milliseconds); return originalTimeout(milliseconds); };
  try {
    assert.equal(await route.sendTelegramEnquiry(validLead, 'secret', '1234', 4500), 'sent');
  } finally { AbortSignal.timeout = originalTimeout; }
  assert.deepEqual(timeouts, [4500]);
  assert.equal(calls.length, 1);
});

test('a status update failure does not reject or lose the saved enquiry', async () => {
  const route = loadRoute({ env: storageEnv, updateError: { message: 'private storage error' } });
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(route.inserts.length, 1);
  assert.doesNotMatch(JSON.stringify(route.errors), /private storage error/);
});

test('Telegram message includes only nonempty fields in the requested plain-text format', () => {
  const route = loadRoute();
  assert.equal(route.formatTelegramEnquiry({ ...validLead, company: '  ', size: ' DN25 ', message: ' Please call. ' }),
    '🔔 New Sinkron Website Enquiry\n\nName: Website Test\nPhone: 1234567890\nEmail: test@example.com\n\nSize: DN25\n\nMessage:\nPlease call.');
});

test('repeated submissions are rate limited', async () => {
  const route = loadRoute();
  for (let i = 0; i < 5; i++) await route.POST(request());
  const response = await route.POST(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('malformed JSON is a client error', async () => {
  const response = await loadRoute().POST(new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }));
  assert.equal(response.status, 400);
});

test('unsupported request formats are rejected before delivery', async () => {
  const response = await loadRoute().POST(new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(validLead) }));
  assert.equal(response.status, 415);
});

test('oversized bodies are rejected even without a content-length header', async () => {
  const route = loadRoute();
  const response = await route.POST(request({ ...validLead, message: 'x'.repeat(20_000) }));
  assert.equal(response.status, 413);
  assert.equal(route.inserts.length, 0);
});

test('spam-field submissions are discarded without saving or sending', async () => {
  const route = loadRoute();
  const response = await route.POST(request({ website: 'spam.example' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(route.inserts.length, 0);
  assert.equal(route.updates.length, 0);
});

test('phone numbers require digits while international formatting is supported', async () => {
  assert.equal((await loadRoute().POST(request({ ...validLead, phone: 'abcdefghi' }))).status, 400);
  assert.equal((await loadRoute().POST(request({ ...validLead, phone: '+91 (88499) 72480' }))).status, 503);
});

test('the rate limit resets after one minute and cannot accumulate unlimited IPs', async () => {
  let now = 1_000;
  const route = loadRoute({ clock: { now: () => now } });
  for (let i = 0; i < 1_000; i++) {
    const req = request(); req.headers.set('x-forwarded-for', `qa-${i}`);
    assert.equal((await route.POST(req)).status, 503);
  }
  const blocked = request(); blocked.headers.set('x-forwarded-for', 'qa-over-limit');
  assert.equal((await route.POST(blocked)).status, 429);
  now += 60_000;
  const afterWindow = request(); afterWindow.headers.set('x-forwarded-for', 'qa-new-window');
  assert.equal((await route.POST(afterWindow)).status, 503);
});

test('UTF-8 characters survive request-stream chunk boundaries', async () => {
  const bytes = new TextEncoder().encode(JSON.stringify({ ...validLead, name: 'José Kumar' }));
  const boundary = bytes.indexOf(0xc3) + 1;
  const body = new ReadableStream({ start(controller) { controller.enqueue(bytes.slice(0, boundary)); controller.enqueue(bytes.slice(boundary)); controller.close(); } });
  const route = loadRoute({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example', SUPABASE_SERVICE_ROLE_KEY: 'test' } });
  const response = await route.POST(new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half' }));
  assert.equal(response.status, 200);
  assert.equal(route.inserts[0].name, 'José Kumar');
});
