import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPdf, needsOcr } from '../../src/backend/modules/generation/pdf-ocr.js';

test('detects missing glyphs and scanned pages without changing valid Thai or IPA', () => {
  for (const text of ['', ' ', 'แอปเ\0ล', 'พื้นที่ �']) assert.equal(needsOcr(text), true);
  assert.equal(needsOcr('apple แอปเปิล /ˈæpəl/'), false);
});

test('OCR only damaged pages, preserving order and terminating the worker', async () => {
  let terminated = false;
  const parser = {
    getText: async () => ({
      text: 'original',
      pages: [
        { num: 1, text: 'valid original text' },
        { num: 2, text: 'แอปเ\0ล' },
      ],
    }),
    getScreenshot: async (options) => {
      assert.deepEqual(options.partial, [2]);
      return { pages: [{ data: Buffer.from('image') }] };
    },
  };
  const result = await extractPdf(parser, async () => ({
    recognize: async () => ({ data: { text: 'apple แอปเปิล' } }),
    terminate: async () => {
      terminated = true;
    },
  }));
  assert.deepEqual(result, { text: 'valid original text\n\napple แอปเปิล', ocrPages: [2] });
  assert.equal(terminated, true);
});

test('valid text skips OCR and excessive scanned pages fail before loading models', async () => {
  const create = () => {
    throw Error('must not load');
  };
  assert.deepEqual(
    await extractPdf(
      { getText: async () => ({ text: 'normal text', pages: [{ num: 1, text: 'normal text' }] }) },
      create,
    ),
    { text: 'normal text', ocrPages: [] },
  );
  await assert.rejects(
    extractPdf(
      {
        getText: async () => ({
          pages: Array.from({ length: 11 }, (_, i) => ({ num: i + 1, text: '' })),
        }),
      },
      create,
    ),
    /10/,
  );
});

test('OCR failure releases resources and does not return partial text', async () => {
  let terminated = false;
  await assert.rejects(
    extractPdf(
      {
        getText: async () => ({ pages: [{ num: 1, text: '' }] }),
        getScreenshot: async () => ({ pages: [{ data: Buffer.alloc(0) }] }),
      },
      async () => ({
        recognize: async () => {
          throw Error('failed');
        },
        terminate: async () => {
          terminated = true;
        },
      }),
    ),
    /failed/,
  );
  assert.equal(terminated, true);
});
