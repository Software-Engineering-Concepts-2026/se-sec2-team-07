import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { extractDocument } from '../../src/backend/modules/generation/extract.js';

const extract = (name, bytes) => extractDocument({ name, content: Buffer.from(bytes).toString('base64') });
const slide = body => `<p:sld xmlns:p="p" xmlns:a="a"><p:sp><p:txBody>${body}</p:txBody></p:sp></p:sld>`;

// Build a complete PDF with byte offsets, rather than mocking the PDF reader.
function pdf(text) {
  const stream = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let data = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(data));
    data += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = Buffer.byteLength(data);
  data += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  data += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  data += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(data);
}

test('issue 3 reads an actual PDF text layer', async () => {
  assert.match(await extract('lesson.pdf', pdf('Stack: Last in first out')), /Stack: Last in first out/);
});

test('issue 3 isolates simultaneous PDF extraction jobs', async () => {
  const texts = ['Stack: Last in first out', 'Queue: First in first out', 'Tree: Hierarchical nodes'];
  const results = await Promise.all(texts.map((text, index) => extract(`lesson${index}.pdf`, pdf(text))));
  results.forEach((result, index) => assert.equal(result, texts[index]));
});

test('issue 3 preserves PPTX run order, paragraphs, entities and numeric text', async () => {
  const zip = zipSync({
    'ppt/slides/slide10.xml': strToU8(slide('<a:p><a:r><a:t>Final slide</a:t></a:r></a:p>')),
    'ppt/slides/slide2.xml': strToU8(slide('<a:p><a:r><a:t>Sta</a:t></a:r><a:fld><a:t>ck</a:t></a:fld><a:r><a:t>: LIFO &amp; FIFO</a:t></a:r></a:p><a:p><a:r><a:t>001</a:t></a:r><a:br/><a:r><a:t>2 &lt; 3</a:t></a:r></a:p>')),
  });
  assert.equal(await extract('slides.PPTX', zip), 'Stack: LIFO & FIFO\n001\n2 < 3\nFinal slide');
});

test('issue 3 rejects corrupt, unsupported and entity-declaring documents', async () => {
  const invalid = [
    ['bad.pdf', '%PDF-1.4\ncorrupt'],
    ['bad.pptx', 'not a zip'],
    ['program.exe', 'unsupported document'],
    ['empty.pdf', pdf('')],
    ['bad.pptx', zipSync({ 'ppt/slides/slide1.xml': strToU8('<p:sld><a:t>unclosed') })],
    ['entity.pptx', zipSync({ 'ppt/slides/slide1.xml': strToU8('<!DOCTYPE p:sld [<!ENTITY x "unsafe">]>' + slide('<a:p><a:r><a:t>&x;</a:t></a:r></a:p>')) })],
  ];
  for (const [name, bytes] of invalid) await assert.rejects(extract(name, bytes), { status: 400 });
});

test('issue 3 retains document size and text limits', async () => {
  await assert.rejects(extract('large.txt', Buffer.alloc(20 * 1024 * 1024 + 1, 65)), /20 MB/);
  await assert.rejects(extract('long.txt', 'a'.repeat(60001)), /60,000/);
  assert.equal(await extract('notes.md', 'คำศัพท์: ความหมายของคำศัพท์'), 'คำศัพท์: ความหมายของคำศัพท์');
});
