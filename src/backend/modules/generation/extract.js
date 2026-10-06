import { fork } from 'node:child_process';
import { HttpError } from '../../shared/errors.js';

let active = 0;
export function extractDocument(input, { detailed = false } = {}) {
  if (active >= 4)
    return Promise.reject(new HttpError(429, 'กำลังอ่านเอกสารอื่นอยู่ กรุณาลองอีกครั้งในสักครู่'));
  active++;
  return new Promise((resolve, reject) => {
    // A process also isolates native PDF parser failures from the API server.
    const worker = fork(new URL('./extract-worker.js', import.meta.url), {
      execArgv: ['--max-old-space-size=256'],
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    });
    let settled = false;
    const finish = (error, text) => {
      if (settled) return;
      settled = true;
      active--;
      clearTimeout(timeout);
      worker.kill();
      if (error) reject(new HttpError(400, error));
      else resolve(text);
    };
    const timeout = setTimeout(
      () => finish('อ่านไฟล์นานเกินไป กรุณาแบ่งไฟล์หรือวางข้อความแทน'),
      180000,
    );
    // Runtime/watch IPC messages are not extraction results.
    worker.on('message', (result) => {
      if (result?.type !== 'focus:extract-result') return;
      if (typeof result.error === 'string' && result.error) return finish(result.error);
      if (typeof result.text !== 'string' || !result.text.trim())
        return finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน');
      finish(
        null,
        detailed
          ? {
              text: result.text,
              ocrPages: result.ocrPages || [],
              requiresReview: Boolean(result.ocrPages?.length),
            }
          : result.text,
      );
    });
    worker.once('error', () => finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน'));
    worker.once('exit', () => {
      if (!settled) finish('ตัวอ่านไฟล์หยุดทำงาน กรุณาวางข้อความแทน');
    });
    worker.send(input, (error) => {
      if (error) finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน');
    });
  });
}
