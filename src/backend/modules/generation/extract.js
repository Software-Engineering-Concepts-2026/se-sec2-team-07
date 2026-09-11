import { Worker } from 'node:worker_threads';
import { HttpError } from '../../shared/errors.js';

export function extractDocument(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./extract-worker.js', import.meta.url), {
      workerData: input, resourceLimits: { maxOldGenerationSizeMb: 256 },
    });
    let settled = false;
    const finish = (error, text) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();
      if (error) reject(new HttpError(400, error)); else resolve(text);
    };
    const timeout = setTimeout(() => finish('อ่านไฟล์นานเกินไป กรุณาแบ่งไฟล์หรือวางข้อความแทน'), 20000);
    worker.once('message', result => finish(result.error, result.text));
    worker.once('error', () => finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน'));
    worker.once('exit', () => { if (!settled) finish('ตัวอ่านไฟล์หยุดทำงาน กรุณาวางข้อความแทน'); });
  });
}
