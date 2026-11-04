import { readFile, writeFile, lstat, chmod } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const connectionMessage = '✅ Sinkron website Telegram notifications are connected successfully.';
const tokenPattern = /^\d+:[A-Za-z0-9_-]{20,}$/;

export class TelegramSetupError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

async function readOptional(file) {
  try { return await readFile(file, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
}

export async function saveLocalEnvironment(directory, values) {
  const file = path.join(directory, '.env.local');
  try {
    const entry = await lstat(file);
    if (!entry.isFile() || entry.isSymbolicLink()) throw new TelegramSetupError('.env.local must be a regular local file.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let content = await readOptional(file);
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  for (const [key, value] of Object.entries(values)) {
    if (!['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].includes(key) ||
      !(key === 'TELEGRAM_BOT_TOKEN' ? tokenPattern : /^[1-9]\d*$/).test(value)) {
      throw new TelegramSetupError('Invalid Telegram configuration.');
    }
    const pattern = new RegExp(`^(?:export\\s+)?${key}\\s*=.*$`);
    let found = false;
    content = content.split(/\r?\n/).filter(line => {
      if (!pattern.test(line)) return true;
      if (found) return false;
      found = true;
      return true;
    }).map(line => pattern.test(line) ? `${key}=${value}` : line).join(newline);
    if (!found) content += `${content && !content.endsWith(newline) ? newline : ''}${key}=${value}${newline}`;
  }
  await writeFile(file, content, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(file, 0o600);
}

export async function ensureGitIgnore(directory) {
  const file = path.join(directory, '.gitignore');
  const content = await readOptional(file);
  const lines = content.split(/\r?\n/).map(line => line.trim());
  const ignore = Math.max(lines.lastIndexOf('.env.local'), lines.lastIndexOf('/.env.local'));
  const unignore = Math.max(lines.lastIndexOf('!.env.local'), lines.lastIndexOf('!/.env.local'));
  if (ignore < 0 || unignore > ignore) {
    await writeFile(file, `${content}${content && !content.endsWith('\n') ? '\n' : ''}.env.local\n`);
  }
}

export async function telegramRequest(token, method, payload, fetchImpl = fetch) {
  if (!tokenPattern.test(token) || !['getUpdates', 'sendMessage'].includes(method)) {
    throw new TelegramSetupError('Invalid Telegram configuration.');
  }
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json();
    if (response.ok && result.ok === true) return result.result;
    const code = Number(result.error_code) || response.status;
    if (code === 401 || code === 404) throw new TelegramSetupError('Telegram rejected the bot token. Replace it in .env.local and run setup again.', 401);
    if (code === 409) throw new TelegramSetupError('This bot has an active webhook or another setup session. Use a new bot or stop that session, then retry.', 409);
    if (code === 403) throw new TelegramSetupError('Open your Telegram bot, unblock it if needed, press Start, and send Hello. Then run setup again.', 403);
    if (code === 429) throw new TelegramSetupError('Telegram is rate limiting requests. Wait a minute, then run setup again.', 429);
    throw new TelegramSetupError('Telegram could not complete the request. Run setup again.');
  } catch (error) {
    if (error instanceof TelegramSetupError) throw error;
    // Never print fetch errors or Telegram response descriptions: they may include credentials.
    throw new TelegramSetupError('Could not reach Telegram. Check your internet connection and run setup again.');
  }
}

export function latestPrivateChatId(updates) {
  if (!Array.isArray(updates)) return null;
  const latest = updates.filter(update => update.message?.chat?.type === 'private' &&
    Number.isSafeInteger(update.message.chat.id) && update.message.chat.id > 0 &&
    Number.isSafeInteger(update.update_id)).sort((a, b) => b.update_id - a.update_id)[0];
  return latest ? String(latest.message.chat.id) : null;
}

async function prompt(message, { secret = false } = {}) {
  if (!process.stdin.isTTY) throw new TelegramSetupError('Run setup in an interactive terminal so your bot token can be entered securely.');
  process.stdout.write(message);
  const hidden = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const terminal = createInterface({ input: process.stdin, output: secret ? hidden : process.stdout, terminal: true, historySize: 0 });
  const controller = new AbortController();
  const cancel = () => controller.abort();
  terminal.once('SIGINT', cancel);
  terminal.once('close', cancel);
  try { return await terminal.question('', { signal: controller.signal }); }
  catch { throw new TelegramSetupError('Setup cancelled. Run the command again when you are ready.'); }
  finally {
    terminal.off('close', cancel);
    terminal.close();
    if (secret) process.stdout.write('\n');
  }
}

export async function runSetup({ directory = projectDir, ask = prompt, request = telegramRequest, output = console.log } = {}) {
  await ensureGitIgnore(directory);
  const existing = parseEnv(await readOptional(path.join(directory, '.env.local')));
  let token = existing.TELEGRAM_BOT_TOKEN?.trim();
  while (!tokenPattern.test(token || '')) {
    token = (await ask('Paste TELEGRAM_BOT_TOKEN (hidden; press Enter): ', { secret: true })).trim();
    if (!tokenPattern.test(token)) output('That token format is not valid. Copy the full token from BotFather and try again.');
  }
  // Save before asking the owner to interact with their bot; preserve all other credentials.
  await saveLocalEnvironment(directory, { TELEGRAM_BOT_TOKEN: token });
  let chatId = null;
  while (!chatId) {
    output('Open your Telegram bot, press Start, and send Hello.');
    await ask('Press Enter after sending Hello: ');
    // Inspect the newest updates so an old backlog cannot select an outdated chat.
    const updates = await request(token, 'getUpdates', { offset: -100, limit: 100, timeout: 0, allowed_updates: ['message'] });
    chatId = latestPrivateChatId(updates);
    if (!chatId) output('No private message found yet. Send Hello directly to your bot, then try again.');
  }
  await saveLocalEnvironment(directory, { TELEGRAM_CHAT_ID: chatId });
  output(`Telegram Chat ID found: ${chatId}`);
  const sent = await request(token, 'sendMessage', { chat_id: chatId, text: connectionMessage });
  if (!Number.isInteger(sent?.message_id) || String(sent.chat?.id) !== chatId) {
    throw new TelegramSetupError('Telegram did not confirm delivery to your private chat. Run setup again.');
  }
  output('✅ Telegram setup complete.');
  return { chatId };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSetup().catch(error => {
    console.error(error instanceof TelegramSetupError ? error.message : 'Setup could not save the configuration. Check access to .env.local and try again.');
    process.exitCode = 1;
  });
}
