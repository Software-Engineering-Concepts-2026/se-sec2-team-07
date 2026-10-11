import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../../src/backend/modules/generation/service.js';

const input = {
  mode: 'ai',
  text: 'apple แอปเปิล\ndog สุนัข',
  language: 'Thai',
  count: 1,
};
const cards = [
  { front: 'apple', back: 'แอปเปิล' },
  { front: 'dog', back: 'สุนัข' },
];
function response(protocol, output) {
  const text = JSON.stringify({ cards: output });
  return {
    ok: true,
    json: async () =>
      protocol === 'chat'
        ? { choices: [{ finish_reason: 'stop', message: { content: text } }] }
        : { status: 'completed', output: [{ content: [{ type: 'output_text', text }] }] },
  };
}

for (const aiApi of ['chat', 'responses']) {
  const config = { aiKey: 'test', aiModel: 'test-model', aiApi };
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    test(`${aiApi} retries an empty ${level} result once without changing the source or level`, async () => {
      const requests = [];
      const result = await generate({ ...input, level }, config, async (_url, options) => {
        requests.push(options);
        return response(aiApi, requests.length === 1 ? [] : cards);
      });
      assert.equal(requests.length, 2);
      assert.equal(requests[0].signal, requests[1].signal);
      const [first, retry] = requests.map((request) => JSON.parse(request.body));
      const instructions = (body) =>
        aiApi === 'chat' ? body.messages[0].content : body.instructions;
      const source = (body) => (aiApi === 'chat' ? body.messages[1].content : body.input);
      assert.equal(source(first), input.text);
      assert.equal(source(retry), input.text);
      // Chat appends the JSON contract after the generation instructions.
      assert.ok(
        instructions(retry).startsWith(instructions(first).split(' Return only valid JSON')[0]),
      );
      assert.match(instructions(retry), /previous attempt returned an empty cards array/);
      assert.match(instructions(retry), /Do not lower the level, invent missing meanings/);
      assert.equal(retry.model, first.model);
      if (aiApi === 'responses') assert.deepEqual(retry.text.format, first.text.format);
      assert.deepEqual(result, [cards[0]]);
    });
  }

  test(`${aiApi} does not retry valid results and caps genuinely empty results at two calls`, async () => {
    for (const output of [cards, []]) {
      let calls = 0;
      const run = generate(input, config, async () => {
        calls++;
        return response(aiApi, output);
      });
      if (output.length) {
        assert.deepEqual(await run, [cards[0]]);
        assert.equal(calls, 1);
      } else {
        await assert.rejects(run, (error) => {
          assert.equal(error.status, 502);
          assert.match(error.message, /รายการการ์ดว่างแม้ตรวจเนื้อหาซ้ำแล้ว/);
          return true;
        });
        assert.equal(calls, 2);
      }
    }
  });

  test(`${aiApi} does not retry malformed results or provider failures`, async () => {
    for (const reply of [
      response(aiApi, [{ front: '', back: 'Answer' }]),
      { ok: false, status: 429 },
    ]) {
      let calls = 0;
      await assert.rejects(
        generate(input, config, async () => {
          calls++;
          return reply;
        }),
        { status: 502 },
      );
      assert.equal(calls, 1);
    }
  });

  test(`${aiApi} preserves a quota error on the second attempt`, async () => {
    let calls = 0;
    await assert.rejects(
      generate(input, config, async () => {
        calls++;
        return calls === 1 ? response(aiApi, []) : { ok: false, status: 429 };
      }),
      (error) => error.status === 502 && error.message.includes('โควตา'),
    );
    assert.equal(calls, 2);
  });
}
