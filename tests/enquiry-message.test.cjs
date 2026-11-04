const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const testModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/enquiry-message.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module: testModule, exports: testModule.exports });
const { formatEnquiryDetails, buildWhatsAppUrl, buildWhatsAppEnquiryUrl } = testModule.exports;
const details = { name: 'QA Test', company: 'Company & Co', phone: '+1 555 123 4567', email: 'qa@example.com',
  application: 'Industrial', meterType: 'Multi-Jet', size: 'DN25', quantity: '2', message: 'Please quote.\nThanks!' };

test('notification details use the requested fields and paragraph grouping', () => {
  assert.equal(formatEnquiryDetails(details), 'Name: QA Test\nCompany: Company & Co\nPhone: +1 555 123 4567\nEmail: qa@example.com\n\nApplication: Industrial\nMeter Type: Multi-Jet\nSize: DN25\nQuantity: 2\n\nMessage:\nPlease quote.\nThanks!');
});

test('empty optional fields and empty sections are omitted', () => {
  assert.equal(formatEnquiryDetails({ name: ' QA Test ', phone: '1234567', email: 'qa@example.com', company: ' ', message: '' }),
    'Name: QA Test\nPhone: 1234567\nEmail: qa@example.com');
  assert.equal(formatEnquiryDetails({}), '');
});

test('WhatsApp links prefill the complete enquiry and encode special characters exactly once', () => {
  const message = 'Quote A&B? #25 + café 💧\nSecond line';
  const url = new URL(buildWhatsAppEnquiryUrl('+1 (555) 123-4567', { ...details, message }));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/15551234567');
  assert.equal(url.searchParams.get('text'), 'Hello Sinkron,\n\nI have submitted an enquiry through your website.\n\n' + formatEnquiryDetails({ ...details, message }));
  assert.ok(url.href.includes('Company%3A%20Company%20%26%20Co'));
  assert.ok(!url.href.includes('%2526'));
});

test('WhatsApp messages include only enquiry fields, never unrelated form or environment keys', () => {
  const url = buildWhatsAppEnquiryUrl('15551234567', { ...details, website: 'spam-field', TELEGRAM_BOT_TOKEN: 'private-token', TELEGRAM_CHAT_ID: 'private-chat' });
  assert.doesNotMatch(url, /spam-field|private-token|private-chat|TELEGRAM/);
});

test('missing or invalid WhatsApp configuration cannot create an unsafe or fallback destination', () => {
  for (const number of ['', ' ', '123', 'invalid', 'https://example.com', '1234567?text=wrong']) {
    assert.equal(buildWhatsAppEnquiryUrl(number, details), null);
  }
  assert.equal(new URL(buildWhatsAppUrl('15551234567', 'Hello')).searchParams.get('text'), 'Hello');
});
