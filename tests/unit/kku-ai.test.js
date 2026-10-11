import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAiConfig } from '../../src/backend/config.js';
import { generate } from '../../src/backend/modules/generation/service.js';
const config = readAiConfig({
  OPENAI_BASE_URL: 'https://gen.ai.kku.ac.th/upacth/api/v1/',
  OPENAI_API_KEY: 'test',
  OPENAI_MODEL: 'claude-sonnet-5',
});
const input = { mode: 'ai', text: 'Stack: LIFO', count: 1, language: 'Thai' };

test('vocabulary fronts contain the term while other questions stay intact', async () => {
  const output = [
    { front: 'คำว่า beautiful หมายถึงอะไร?', back: 'สวย' },
    { front: 'คำว่า take care หมายถึงอะไร?', back: 'ดูแล' },
    { front: 'ทำไม Stack จึงใช้ LIFO?', back: 'นำข้อมูลล่าสุดออกก่อน' },
  ];
  const cards = await generate({ ...input, count: 3 }, config, async (url, options) => {
    assert.match(JSON.parse(options.body).messages[0].content, /only the exact term/);
    return {
      ok: true,
      json: async () => ({
        choices: [
          { finish_reason: 'stop', message: { content: JSON.stringify({ cards: output }) } },
        ],
      }),
    };
  });
  assert.deepEqual(cards, [
    { front: 'beautiful', back: 'สวย' },
    { front: 'take care', back: 'ดูแล' },
    output[2],
  ]);
});
test('KKU Claude Sonnet uses chat contract and validates JSON including fenced output', async () => {
  for (const fenced of [false, true]) {
    const cards = await generate(input, config, async (url, options) => {
      assert.equal(url, 'https://gen.ai.kku.ac.th/upacth/api/v1/chat/completions');
      const body = JSON.parse(options.body);
      assert.equal(body.stream, false);
      assert.equal(body.model, 'claude-sonnet-5');
      assert.equal(body.messages[1].content, input.text);
      assert.equal(body.response_format, undefined);
      assert.equal(options.redirect, 'error');
      const text = JSON.stringify({ cards: [{ front: 'Stack?', back: 'LIFO' }] });
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              finish_reason: 'stop',
              message: { content: fenced ? '```json\n' + text + '\n```' : text },
            },
          ],
        }),
      };
    });
    assert.deepEqual(cards, [{ front: 'Stack?', back: 'LIFO' }]);
  }
});
test('KKU rejects truncated, refused and invalid outputs', async () => {
  for (const choice of [
    { finish_reason: 'length', message: { content: '{"cards":[]}' } },
    { finish_reason: 'stop', message: { content: 'not JSON' } },
    { finish_reason: 'stop', message: { content: '{"cards":[{"front":"","back":"x"}]}' } },
    { finish_reason: 'stop', message: { refusal: 'no', content: '{"cards":[]}' } },
  ])
    await assert.rejects(
      generate(input, config, async () => ({
        ok: true,
        json: async () => ({ choices: [choice] }),
      })),
      { status: 502 },
    );
});
test('AI endpoint configuration rejects unsafe URLs and unknown protocols', () => {
  assert.equal(readAiConfig({}).aiApi, 'responses');
  assert.equal(config.aiApi, 'chat');
  for (const url of [
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com?key=x',
  ])
    assert.throws(() => readAiConfig({ OPENAI_BASE_URL: url }));
  assert.throws(() => readAiConfig({ OPENAI_API_MODE: 'unknown' }));
});

test('vocabulary format takes precedence over comparison and analysis at every level', async () => {
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    await generate(
      { ...input, level, text: 'Vocab Meaning\nbest ดีที่สุด\nbetter ดีกว่า' },
      config,
      async (url, options) => {
        const instructions = JSON.parse(options.body).messages[0].content;
        assert.match(instructions, /one separate card per term/);
        assert.match(instructions, /Never combine terms, compare terms/);
        assert.match(instructions, /takes priority over ALL difficulty instructions/);
        assert.match(instructions, /Only for non-vocabulary study material apply/);
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                finish_reason: 'stop',
                message: {
                  content: JSON.stringify({ cards: [{ front: 'best', back: 'ดีที่สุด' }] }),
                },
              },
            ],
          }),
        };
      },
    );
  }
});
