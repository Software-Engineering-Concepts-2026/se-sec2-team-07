import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function needsOcr(text) {
  return text.trim().length < 10 || /[\u0000\uFFFD]/u.test(text);
}

async function createOcr() {
  const { createWorker } = await import('tesseract.js');
  const cachePath = resolve('.local/ocr');
  await mkdir(cachePath, { recursive: true });
  return createWorker('tha+eng', 1, { cachePath });
}

// Keep valid pages intact and process images sequentially to bound memory usage.
export async function extractPdf(parser, createWorker = createOcr) {
  const result = await parser.getText({ pageJoiner: '' });
  const damaged = result.pages.filter(page => needsOcr(page.text));
  if (damaged.length > 10) throw Error('เอกสารนี้ต้องอ่านจากภาพเกิน 10 หน้า กรุณาแบ่งไฟล์เป็นส่วนย่อย');
  if (!damaged.length) return { text: result.text, ocrPages: [] };
  let worker;
  try {
    worker = await createWorker();
    const texts = [];
    for (const page of result.pages) {
      if (!needsOcr(page.text)) { texts.push(page.text); continue; }
      const screenshot = await parser.getScreenshot({ partial: [page.num], desiredWidth: 2000, imageDataUrl: false });
      const { data } = await worker.recognize(screenshot.pages[0].data);
      if (!data.text?.trim() || /[\u0000\uFFFD]/u.test(data.text)) {
        throw Error('OCR อ่านข้อความไม่สำเร็จ กรุณาใช้ภาพที่ชัดขึ้นหรือวางข้อความต้นฉบับ');
      }
      texts.push(data.text);
      if (texts.join('\n').length > 60000) throw Error('ข้อความเกิน 60,000 ตัวอักษร กรุณาแบ่งเอกสาร');
    }
    return { text: texts.join('\n\n'), ocrPages: damaged.map(page => page.num) };
  } finally { await worker?.terminate(); }
}
