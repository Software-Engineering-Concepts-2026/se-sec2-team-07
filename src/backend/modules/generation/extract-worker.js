import { parentPort, workerData } from 'node:worker_threads';
import { extname } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

async function extract({ name, content }) {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content)) throw Error('ข้อมูลไฟล์ไม่ถูกต้อง');
  const raw = Buffer.from(content, 'base64');
  if (raw.length > 20 * 1024 * 1024) throw Error('ไฟล์ต้องไม่เกิน 20 MB');
  let text;
  const extension = extname(name).toLowerCase();
  if (['.txt', '.md'].includes(extension)) {
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(raw); }
    catch { throw Error('กรุณาบันทึกข้อความเป็น UTF-8'); }
  } else if (extension === '.pdf') {
    if (!raw.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw Error('ไฟล์ PDF ไม่ถูกต้อง');
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(raw) });
    try {
      const info = await parser.getInfo();
      if (info.total > 100) throw Error('รองรับ PDF ไม่เกิน 100 หน้า');
      text = (await parser.getText()).text;
    } finally { await parser.destroy(); }
  } else if (extension === '.pptx') {
    let total = 0;
    const files = unzipSync(raw, { filter: entry => {
      total += entry.originalSize;
      if (total > 50 * 1024 * 1024) throw Error('ไฟล์ที่คลายแล้วใหญ่เกิน 50 MB');
      return /^ppt\/slides\/slide\d+\.xml$/.test(entry.name);
    } });
    const parser = new XMLParser({ ignoreAttributes: true, processEntities: false });
    const values = value => {
      if (value == null || typeof value !== 'object') return [];
      return Object.entries(value).flatMap(([key, item]) => key === 'a:t' ? [String(item)] :
        Array.isArray(item) ? item.flatMap(values) : values(item));
    };
    text = Object.keys(files).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1])).map(name => {
      const xml = strFromU8(files[name]);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw Error('ไฟล์ PPTX ไม่ถูกต้อง');
      return values(parser.parse(xml)).join(' ');
    }).join('\n');
  } else throw Error('รองรับ PDF, PPTX, TXT และ MD เท่านั้น');
  text = text.trim();
  if (text.length < 10) throw Error('ไม่พบข้อความในไฟล์ อาจเป็นภาพสแกน กรุณาวางข้อความแทน');
  if (text.length > 60000) throw Error('ข้อความเกิน 60,000 ตัวอักษร กรุณาแบ่งเอกสารเป็นส่วนย่อย');
  return text;
}
try { parentPort.postMessage({ text: await extract(workerData) }); }
catch (error) { parentPort.postMessage({ error: error.message }); }
