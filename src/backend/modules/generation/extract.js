import { fork } from 'node:child_process';
import { HttpError } from '../../shared/errors.js';

export function extractDocument(input) {
  return new Promise((resolve, reject) => {
    // A process also isolates native PDF parser failures from the API server.
    const worker = fork(new URL('./extract-worker.js', import.meta.url), {
      execArgv: ['--max-old-space-size=256'], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    });
    let settled = false;
    const finish = (error, text) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.kill();
      if (error) reject(new HttpError(400, error)); else resolve(text);
    };
    const timeout = setTimeout(() => finish('อ่านไฟล์นานเกินไป กรุณาแบ่งไฟล์หรือวางข้อความแทน'), 20000);
    worker.once('message', result => finish(result.error, result.text));
    worker.once('error', () => finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน'));
    worker.once('exit', () => { if (!settled) finish('ตัวอ่านไฟล์หยุดทำงาน กรุณาวางข้อความแทน'); });
    worker.send(input, error => { if (error) finish('อ่านไฟล์ไม่สำเร็จ กรุณาวางข้อความแทน'); });
  });
}
