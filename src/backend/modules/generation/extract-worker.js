import { extractPdf } from './pdf-ocr.js';
import { extname } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

async function extract({ name, content }) {
  if (content.length > Math.ceil(20 * 1024 * 1024 / 3) * 4) throw Error('ไฟล์ต้องไม่เกิน 20 MB');
  if (content.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(content) || !/^[^=]*={0,2}$/.test(content)) throw Error('ข้อมูลไฟล์ไม่ถูกต้อง');
  const raw = Buffer.from(content, 'base64');
  if (raw.length > 20 * 1024 * 1024) throw Error('ไฟล์ต้องไม่เกิน 20 MB');
  let text;
  let ocrPages = [];
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
      ({ text, ocrPages } = await extractPdf(parser));
    } finally { await parser.destroy(); }
  } else if (extension === '.pptx') {
    let total = 0;
    const files = unzipSync(raw, { filter: entry => {
      total += entry.originalSize;
      if (total > 50 * 1024 * 1024) throw Error('ไฟล์ที่คลายแล้วใหญ่เกิน 50 MB');
      return /^ppt\/slides\/slide\d+\.xml$/.test(entry.name);
    } });
    const parser = new XMLParser({
      preserveOrder: true, ignoreAttributes: true, parseTagValue: false,
      trimValues: false, processEntities: true,
    });
    // Runs may split a single word; only paragraph and explicit breaks add newlines.
    const slideText = nodes => nodes.map(node => Object.entries(node).map(([key, value]) => {
      if (key === 'a:t') return value.map(part => part['#text'] ?? '').join('');
      if (key === 'a:br') return '\n';
      if (!Array.isArray(value)) return '';
      return slideText(value) + (key === 'a:p' ? '\n' : '');
    }).join('')).join('');
    text = Object.keys(files).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1])).map(name => {
      const xml = strFromU8(files[name]);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw Error('ไฟล์ PPTX ไม่ถูกต้อง');
      return slideText(parser.parse(xml)).trim();
    }).join('\n');
  } else throw Error('รองรับ PDF, PPTX, TXT และ MD เท่านั้น');
  text = text.trim();
  if (text.length < 10) throw Error('ไม่พบข้อความในไฟล์ อาจเป็นภาพสแกน กรุณาวางข้อความแทน');
  if (text.length > 60000) throw Error('ข้อความเกิน 60,000 ตัวอักษร กรุณาแบ่งเอกสารเป็นส่วนย่อย');
  return { text, ocrPages };
}
process.once('message', async input => {
  try { process.send({ type: 'focus:extract-result', ...await extract(input) }); }
  catch (error) { process.send({ type: 'focus:extract-result', error: error.message || 'อ่านไฟล์ไม่สำเร็จ' }); }
});
