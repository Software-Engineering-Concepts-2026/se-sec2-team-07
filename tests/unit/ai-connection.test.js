import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../../src/backend/modules/generation/service.js';
import { readConfig } from '../../src/backend/config.js';

test('AI configuration trims whitespace and does not treat whitespace as configured', () => {
  const base = { NODE_ENV: 'test', DATABASE_URL: 'test', JWT_SECRET: 'x'.repeat(32) };
  const result = readConfig({ ...base, OPENAI_API_KEY: ' test-key ', OPENAI_MODEL: ' test-model ' });
  assert.equal(result.aiKey, 'test-key');
  assert.equal(result.aiModel, 'test-model');
  assert.equal(readConfig({ ...base, OPENAI_API_KEY: ' ' }).aiKey, '');
});

test('AI provider errors give actionable messages without exposing upstream details', async () => {
  for (const [status, phrase] of [[401, 'API key'], [403, 'สิทธิ์'], [404, 'โมเดล'], [429, 'โควตา'], [500, 'ไม่พร้อมใช้งาน']]) {
    await assert.rejects(generate({ mode: 'ai', text: 'Stack: LIFO', count: 1, language: 'Thai' },
      { aiKey: 'secret-test-key', aiModel: 'test-model' }, async () => ({ ok: false, status,
        json() { assert.fail('Do not read provider error bodies'); } })), error => {
      assert.equal(error.status, 502);
      assert.ok(error.message.includes(phrase));
      assert.ok(!error.message.includes('secret-test-key'));
      return true;
    });
  }
});

test('AI timeouts explain how to retry', async () => {
  await assert.rejects(generate({ mode: 'ai', text: 'Stack: LIFO', count: 1, language: 'Thai' },
    { aiKey: 'test', aiModel: 'test' }, async () => { throw new DOMException('timed out', 'TimeoutError'); }),
  error => error.status === 502 && error.message.includes('ลดเนื้อหา'));
});
