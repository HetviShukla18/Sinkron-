import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { ensureGitIgnore, latestPrivateChatId, runSetup, saveLocalEnvironment, telegramRequest } from '../scripts/setup-telegram.mjs';

const fakeToken = '123456:abcdefghijklmnopqrstuvwxyz0123456789';
const privateUpdate = (id, chatId) => ({ update_id: id, message: { chat: { id: chatId, type: 'private' } } });

async function fixture(t) {
  const root = path.resolve('.preview');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'telegram-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), root);
    assert.ok(path.basename(directory).startsWith('telegram-test-'));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test('guided setup hides the token, saves only to .env.local, finds the newest private chat, and confirms a test message', async t => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, '.env.local'), 'SUPABASE_SERVICE_ROLE_KEY=existing-storage-secret\n');
  const prompts = [], output = [], requests = [];
  await runSetup({ directory,
    ask: async (message, options) => {
      prompts.push({ message, options });
      if (options?.secret) return fakeToken;
      assert.equal(parseEnv(await readFile(path.join(directory, '.env.local'), 'utf8')).TELEGRAM_BOT_TOKEN, fakeToken);
      return '';
    },
    request: async (token, method, body) => {
      assert.equal(token, fakeToken);
      requests.push({ method, body });
      return method === 'getUpdates'
        ? [privateUpdate(3, 333), { update_id: 9, message: { chat: { id: -1, type: 'group' } } }, privateUpdate(1, 111)]
        : { message_id: 10, chat: { id: 333 } };
    }, output: message => output.push(message),
  });
  const env = parseEnv(await readFile(path.join(directory, '.env.local'), 'utf8'));
  assert.equal(env.TELEGRAM_BOT_TOKEN, fakeToken);
  assert.equal(env.TELEGRAM_CHAT_ID, '333');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, 'existing-storage-secret');
  assert.equal(prompts[0].options.secret, true);
  assert.deepEqual(requests.map(item => item.method), ['getUpdates', 'sendMessage']);
  assert.equal(requests[0].body.offset, -100);
  assert.equal(requests[1].body.text, '✅ Sinkron website Telegram notifications are connected successfully.');
  assert.equal(output.at(-1), '✅ Telegram setup complete.');
  assert.ok(output.includes('Telegram Chat ID found: 333'));
  assert.doesNotMatch(output.join('\n'), /abcdefghijklmnopqrstuvwxyz|existing-storage-secret/);
  assert.match(await readFile(path.join(directory, '.gitignore'), 'utf8'), /^\.env\.local$/m);
});

test('rerunning setup reuses the private token and replaces stale or duplicate chat IDs', async t => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, '.env.local'), `TELEGRAM_BOT_TOKEN=${fakeToken}\r\nTELEGRAM_CHAT_ID=111\r\nTELEGRAM_CHAT_ID=222\r\nOTHER="keep me"\r\n`);
  await runSetup({ directory,
    ask: async (_message, options) => { assert.ok(!options?.secret); return ''; },
    request: async (_token, method) => method === 'getUpdates' ? [privateUpdate(8, 888)] : { message_id: 1, chat: { id: 888 } },
    output: () => {},
  });
  const content = await readFile(path.join(directory, '.env.local'), 'utf8');
  assert.equal((content.match(/^TELEGRAM_CHAT_ID=/gm) || []).length, 1);
  assert.equal(parseEnv(content).TELEGRAM_CHAT_ID, '888');
  assert.ok(content.includes('OTHER="keep me"\r\n'));
});

test('setup retries when no private message has arrived yet', async t => {
  const directory = await fixture(t);
  await saveLocalEnvironment(directory, { TELEGRAM_BOT_TOKEN: fakeToken });
  let reads = 0, enters = 0;
  await runSetup({ directory,
    ask: async () => { enters++; return ''; },
    request: async (_token, method) => method === 'getUpdates'
      ? (++reads === 1 ? [] : [privateUpdate(1, 55)]) : { message_id: 1, chat: { id: 55 } },
    output: () => {},
  });
  assert.equal(enters, 2);
  assert.equal(reads, 2);
});

test('group, channel, unsafe, and malformed chat IDs are ignored', () => {
  assert.equal(latestPrivateChatId(null), null);
  assert.equal(latestPrivateChatId([
    { update_id: 50, channel_post: { chat: { id: -2, type: 'channel' } } },
    { update_id: 60, message: { chat: { id: -3, type: 'group' } } },
    privateUpdate(40, Number.MAX_SAFE_INTEGER + 1), privateUpdate(30, -1),
  ]), null);
  assert.equal(latestPrivateChatId([privateUpdate(3, 33), privateUpdate(10, 100), privateUpdate(1, 11)]), '100');
});

test('Telegram transport uses only the official API with POST JSON and a timeout', async () => {
  const result = await telegramRequest(fakeToken, 'getUpdates', { limit: 100 }, async (url, options) => {
    assert.equal(new URL(url).origin, 'https://api.telegram.org');
    assert.equal(new URL(url).pathname, `/bot${fakeToken}/getUpdates`);
    assert.equal(options.method, 'POST');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), { limit: 100 });
    return Response.json({ ok: true, result: [] });
  });
  assert.deepEqual(result, []);
});

test('network errors and Telegram descriptions cannot leak tokens through setup errors', async () => {
  for (const fetchImpl of [
    async () => { throw new Error(`Request failed for https://api.telegram.org/bot${fakeToken}/sendMessage`); },
    async () => Response.json({ ok: false, error_code: 401, description: fakeToken }, { status: 401 }),
    async () => Response.json({ ok: false, error_code: 409, description: fakeToken }, { status: 409 }),
    async () => Response.json({ ok: false, error_code: 403, description: fakeToken }, { status: 403 }),
    async () => Response.json({ ok: false, error_code: 429, description: fakeToken }, { status: 429 }),
  ]) {
    await assert.rejects(telegramRequest(fakeToken, 'getUpdates', {}, fetchImpl), error => {
      assert.ok(!error.message.includes(fakeToken));
      assert.ok(!error.message.includes('https://'));
      return true;
    });
  }
});

test('setup never reports complete if Telegram has not confirmed the private test message', async t => {
  const directory = await fixture(t);
  await saveLocalEnvironment(directory, { TELEGRAM_BOT_TOKEN: fakeToken });
  const output = [];
  await assert.rejects(runSetup({ directory,
    ask: async () => '',
    request: async (_token, method) => method === 'getUpdates' ? [privateUpdate(1, 55)] : { message_id: 1, chat: { id: 99 } },
    output: message => output.push(message),
  }), /did not confirm delivery/);
  assert.ok(!output.includes('✅ Telegram setup complete.'));
  assert.equal(parseEnv(await readFile(path.join(directory, '.env.local'), 'utf8')).TELEGRAM_CHAT_ID, '55');
});

test('environment updates reject injected values and non-regular files', async t => {
  const directory = await fixture(t);
  await assert.rejects(saveLocalEnvironment(directory, { TELEGRAM_BOT_TOKEN: fakeToken + '\nOTHER=bad' }), /Invalid Telegram/);
  await assert.rejects(saveLocalEnvironment(directory, { NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: fakeToken }), /Invalid Telegram/);
  await mkdir(path.join(directory, '.env.local'));
  await assert.rejects(saveLocalEnvironment(directory, { TELEGRAM_CHAT_ID: '123' }), /regular local file/);
});

test('.env.local stays ignored even when a later rule explicitly unignores it', async t => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, '.gitignore'), '.env.local\n!.env.local\n');
  await ensureGitIgnore(directory);
  const content = await readFile(path.join(directory, '.gitignore'), 'utf8');
  assert.ok(content.endsWith('.env.local\n'));
  await ensureGitIgnore(directory);
  assert.equal(await readFile(path.join(directory, '.gitignore'), 'utf8'), content);
});
