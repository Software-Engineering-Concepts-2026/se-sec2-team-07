import test from 'node:test';
import assert from 'node:assert/strict';
import { schedule } from '../../src/backend/modules/reviews/service.js';
import { summarize } from '../../src/backend/modules/stats/service.js';
import { generate, generateLocal } from '../../src/backend/modules/generation/service.js';
import { hashPassword, verifyPassword } from '../../src/backend/modules/auth/service.js';
import { extractDocument } from '../../src/backend/modules/generation/extract.js';
import { zipSync, strToU8 } from 'fflate';

test('SRS repeats forgotten cards in 10 minutes and spaces successful reviews', () => {
  assert.equal(schedule(8, 'again'), 10 / 1440);
  assert.equal(schedule(0, 'hard'), 1);
  assert.equal(schedule(4, 'good'), 8);
  assert.equal(schedule(4, 'easy'), 10);
  assert.throws(() => schedule(0, 'wrong'));
});
test('statistics use Bangkok date and preserve yesterday streak', () => {
  const now = Date.parse('2026-09-11T18:00:00Z'); // September 12 in Bangkok
  const rows = [{ created: Date.parse('2026-09-11T12:00:00Z') / 1000, rating: 'good', seconds: 30 },
    { created: Date.parse('2026-09-10T12:00:00Z') / 1000, rating: 'again', seconds: 10 }];
  const stats = summarize(rows, now);
  assert.equal(stats.today, 0); assert.equal(stats.streak, 2); assert.equal(stats.accuracy, 50);
  assert.equal(stats.seconds, 40); assert.equal(stats.weekly.at(-1).date, '2026-09-12');
  assert.equal(summarize([], now).accuracy, 0);
});
test('passwords use distinct salts and retain Python scrypt compatibility', async () => {
  const a = await hashPassword('Password123'); const b = await hashPassword('Password123');
  assert.notEqual(a, b); assert.equal(await verifyPassword('Password123', a), true);
  assert.equal(await verifyPassword('wrong', a), false);
  assert.equal(await verifyPassword('Password123', 'bad'), false);
});
test('local generation splits definitions and limits output', () => {
  assert.deepEqual(generateLocal('Stack: LIFO\nQueue: FIFO', 1), [{ front: 'Stack', back: 'LIFO' }]);
  assert.match(generateLocal('A short lesson with several words to learn', 1)[0].front, /____/);
});
test('AI request uses structured output and handles upstream failures', async () => {
  let payload;
  const request = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses'); payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ cards: [{ front: 'Question', back: 'Answer' }] }) }] }] }) };
  };
  const input = { text: 'Source text', count: 5, mode: 'ai', language: 'Thai' };
  const config = { aiKey: 'test-key', aiModel: 'test-model' };
  assert.equal((await generate(input, config, request))[0].back, 'Answer');
  assert.equal(payload.store, false); assert.equal(payload.text.format.type, 'json_schema');
  await assert.rejects(generate(input, config, async () => ({ ok: false })), { status: 502 });
  await assert.rejects(generate(input, {}), { status: 503 });
});
test('document workers extract UTF-8 and PPTX and reject invalid files', async () => {
  const text = 'Stack: Last in first out';
  assert.equal(await extractDocument({ name: 'notes.txt', content: Buffer.from(text).toString('base64') }), text);
  const zip = zipSync({ 'ppt/slides/slide1.xml': strToU8(`<p:sld xmlns:p="p" xmlns:a="a"><p:sp><a:t>${text}</a:t></p:sp></p:sld>`) });
  assert.equal(await extractDocument({ name: 'slides.pptx', content: Buffer.from(zip).toString('base64') }), text);
  await assert.rejects(extractDocument({ name: 'bad.pdf', content: Buffer.from('not a pdf').toString('base64') }), { status: 400 });
  await assert.rejects(extractDocument({ name: 'x.exe', content: Buffer.from(text).toString('base64') }), { status: 400 });
  await assert.rejects(extractDocument({ name: 'x.txt', content: 'invalid***' }), { status: 400 });
});
