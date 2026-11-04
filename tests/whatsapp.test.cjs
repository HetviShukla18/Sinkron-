const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const messageModule = { exports: {} };
vm.runInNewContext(compile('lib/enquiry-message.ts'), { module: messageModule, exports: messageModule.exports });
const compiled = compile('lib/whatsapp.ts');
const env = {
  WHATSAPP_ACCESS_TOKEN: 'meta-secret', WHATSAPP_PHONE_NUMBER_ID: '123456789012345',
  WHATSAPP_RECIPIENT_NUMBER: '+91 (98765) 43210', WHATSAPP_API_VERSION: 'v23.0',
  WHATSAPP_TEMPLATE_NAME: 'sinkron_website_enquiry', WHATSAPP_TEMPLATE_LANGUAGE: 'en_US',
};
const enquiry = { name: 'Test Customer', phone: '+91 99999 00000', email: 'customer@example.com' };
const accepted = () => Response.json({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.test-message-id' }] });
function load({ settings = env, fetch = async () => { throw new Error('Unexpected request'); } } = {}) {
  const mod = { exports: {} }, errors = [];
  vm.runInNewContext(compiled, {
    module: mod, exports: mod.exports, process: { env: settings }, fetch, AbortSignal,
    console: { error: (...args) => errors.push(args) },
    require: name => name === 'server-only' ? {} : name === '@/lib/enquiry-message' ? messageModule.exports : require(name),
  });
  return { ...mod.exports, errors };
}

test('automatic notifications never use the public Click-to-Chat number or customer phone as a fallback', async () => {
  let calls = 0;
  const sender = load({ settings: { NEXT_PUBLIC_WHATSAPP_NUMBER: '919999999999' }, fetch: async () => { calls++; return accepted(); } });
  assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'skipped');
  assert.equal(calls, 0);
});

test('all private credentials and approved template settings are required, with no text-message fallback', async () => {
  for (const key of Object.keys(env)) {
    let calls = 0;
    const sender = load({ settings: { ...env, [key]: '  ' }, fetch: async () => { calls++; return accepted(); } });
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'skipped', key);
    assert.equal(calls, 0);
    assert.doesNotMatch(JSON.stringify(sender.errors), /meta-secret|123456789012345|98765|customer@example/);
  }
});

test('template parameters omit blank optional fields and normalize multiline content without truncating it', () => {
  const sender = load();
  const message = 'Please quote.\n\t' + 'x'.repeat(1400);
  const values = sender.buildWhatsAppTemplateParameters({ ...enquiry, company: ' ', application: ' Industrial ', meterType: 'Multi-Jet', size: '', quantity: '2', message });
  assert.equal(values.length, 4);
  assert.equal(values[0].text, enquiry.name);
  assert.equal(values[1].text, enquiry.phone);
  assert.equal(values[2].text, enquiry.email);
  assert.equal(values[3].text, 'Application: Industrial | Meter Type: Multi-Jet | Quantity: 2 | Message: Please quote. | ' + 'x'.repeat(1400));
  assert.doesNotMatch(values[3].text, /Company:|Size:|[\n\r\t]| {2}/);
  assert.ok(values.every(value => value.type === 'text' && value.text.trim()));
});

test('empty optional information still produces a nonempty template parameter without blank field labels', () => {
  const sender = load();
  const values = sender.buildWhatsAppTemplateParameters({ ...enquiry, company: ' ', message: '' });
  assert.equal(values[3].text, 'No additional details provided.');
  assert.doesNotMatch(values[3].text, /Company:|Application:|Meter Type:|Size:|Quantity:|Message:/);
});

test('Cloud API sends the four-slot approved template to the server-configured recipient with Bearer authorization', async () => {
  const calls = [];
  const sender = load({ fetch: async (url, options) => { calls.push({ url, options }); return accepted(); } });
  assert.equal(await sender.sendWhatsAppEnquiry({ ...enquiry, company: 'Sinkron', message: 'Please call.' }), 'sent');
  assert.equal(calls.length, 1);
  const { url, options } = calls[0];
  assert.equal(url, 'https://graph.facebook.com/v23.0/123456789012345/messages');
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.Authorization, 'Bearer meta-secret');
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.redirect, 'error');
  assert.ok(options.signal instanceof AbortSignal);
  const body = JSON.parse(options.body);
  assert.equal(body.messaging_product, 'whatsapp');
  assert.equal(body.type, 'template');
  assert.equal(body.to, '919876543210');
  assert.equal(body.template.name, env.WHATSAPP_TEMPLATE_NAME);
  assert.equal(body.template.language.code, 'en_US');
  assert.equal(body.template.components.length, 1);
  assert.equal(body.template.components[0].type, 'body');
  assert.equal(body.template.components[0].parameters.length, 4);
  assert.match(body.template.components[0].parameters[3].text, /Company: Sinkron.*Message: Please call\./);
  assert.doesNotMatch(url + options.body, /meta-secret|wa\.me/);
});

test('invalid routing settings cannot redirect requests or leak credentials', async () => {
  for (const [key, value] of [
    ['WHATSAPP_PHONE_NUMBER_ID', '../attacker?token=secret'], ['WHATSAPP_RECIPIENT_NUMBER', 'https://example.com'],
    ['WHATSAPP_API_VERSION', 'v23.0/../../attacker'], ['WHATSAPP_TEMPLATE_NAME', 'template with spaces'],
    ['WHATSAPP_TEMPLATE_LANGUAGE', 'en/US'],
  ]) {
    let calls = 0;
    const sender = load({ settings: { ...env, [key]: value }, fetch: async () => { calls++; return accepted(); } });
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'failed');
    assert.equal(calls, 0);
    assert.doesNotMatch(JSON.stringify(sender.errors), /meta-secret|attacker|example\.com|98765/);
  }
});

test('HTTP errors, missing message IDs and malformed JSON never count as successful sends', async () => {
  for (const response of [
    () => Response.json({ error: { code: 190, message: 'meta-secret private response' } }, { status: 401 }),
    () => Response.json({ messaging_product: 'whatsapp', messages: [] }),
    () => Response.json({ messaging_product: 'whatsapp', messages: [{ id: '' }] }),
    () => Response.json({ messaging_product: 'whatsapp', messages: [{ id: 'invalid' }] }),
    () => Response.json(null),
    () => new Response('<html>private provider detail</html>', { status: 502 }),
    () => Response.json({ messaging_product: 'whatsapp', messages: [{ id: 'wamid.test' }] }, { status: 500 }),
  ]) {
    const sender = load({ fetch: async () => response() });
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'failed');
    assert.doesNotMatch(JSON.stringify(sender.errors), /meta-secret|private response|provider detail|customer@example/);
  }
});

test('safe Meta errors identify setup issues without copying provider responses', async () => {
  for (const [code, reason] of [[190, /access token/], [131030, /verify the recipient/], [132001, /template name or language/], [132000, /four body text/], [132015, /paused or disabled/], [130429, /rate limiting/]]) {
    const sender = load({ fetch: async () => Response.json({ error: { code, message: 'meta-secret recipient 919876543210 private provider error' } }, { status: 400 }) });
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'failed');
    assert.match(sender.errors[0][0], reason);
    assert.doesNotMatch(JSON.stringify(sender.errors), /meta-secret|919876543210|private provider/);
  }
});

test('network failures and timeouts are safe and are never retried', async () => {
  for (const error of [new Error('Bearer meta-secret customer@example.com'), new DOMException('meta-secret', 'TimeoutError')]) {
    let calls = 0;
    const sender = load({ fetch: async () => { calls++; throw error; } });
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry), 'failed');
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(sender.errors), /meta-secret|customer@example/);
    if (error.name === 'TimeoutError') assert.match(sender.errors[0][0], /timed out/);
  }
});

test('the route-provided deadline is used and an exhausted time budget skips sending', async () => {
  const timeouts = [], calls = [];
  const sender = load({ fetch: async url => { calls.push(url); return accepted(); } });
  const originalTimeout = AbortSignal.timeout;
  AbortSignal.timeout = ms => { timeouts.push(ms); return originalTimeout(ms); };
  try {
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry, sender.getWhatsAppConfig(), 1250), 'sent');
    assert.equal(await sender.sendWhatsAppEnquiry(enquiry, sender.getWhatsAppConfig(), 0), 'skipped');
  } finally { AbortSignal.timeout = originalTimeout; }
  assert.deepEqual(timeouts, [1250]);
  assert.equal(calls.length, 1);
});
