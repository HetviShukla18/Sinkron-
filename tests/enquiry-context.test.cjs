const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const testModule = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, { module: testModule, exports: testModule.exports, require: name => imports[name] ?? require(name) });
  return testModule.exports;
}

const { getEnquiryContext } = load('lib/enquiry-context.ts', { '@/lib/data': load('lib/data.ts') });

test('product links retain the selected meter in the enquiry', () => {
  for (const [slug, label] of [['single-jet', 'Single-Jet'], ['multi-jet', 'Multi-Jet'], ['woltman', 'Woltman']]) {
    const result = getEnquiryContext({ meter: slug });
    assert.equal(result.initial.meterType, label);
    assert.ok(result.selection.includes(label));
  }
});

test('application links map residential to the form’s domestic category', () => {
  const residential = getEnquiryContext({ application: 'residential', meter: 'multi-jet' });
  assert.equal(residential.initial.application, 'Domestic');
  assert.equal(residential.initial.meterType, 'Multi-Jet');
  assert.ok(residential.selection.includes('Residential application'));
  assert.equal(getEnquiryContext({ application: 'industrial' }).initial.application, 'Industrial');
});

test('unsupported or repeated query values do not prefill the form', () => {
  const result = getEnquiryContext({ meter: ['single-jet', 'woltman'], application: '<invalid>', subject: '__proto__' });
  assert.equal(result.initial.meterType, '');
  assert.equal(result.initial.application, '');
  assert.equal(result.initial.message, '');
  assert.equal(result.selection, '');
  assert.equal(getEnquiryContext({ subject: 'toString' }).initial.message, '');
});

test('footer policy requests carry a clear subject into the enquiry', () => {
  assert.match(getEnquiryContext({ subject: 'privacy-policy' }).initial.message, /privacy policy/);
  assert.match(getEnquiryContext({ subject: 'terms' }).initial.message, /terms and conditions/);
  assert.equal(getEnquiryContext({}).initial.message, '');
});
