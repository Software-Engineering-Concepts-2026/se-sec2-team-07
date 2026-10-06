import { ZodError } from 'zod';
import { HttpError } from '../shared/errors.js';
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError)
    return res.status(400).json({
      error: 'กรุณาตรวจข้อมูลให้ครบและอยู่ในขนาดที่กำหนด',
      fields: error.issues.map((i) => i.path.join('.')),
    });
  if (error.type === 'entity.too.large')
    return res.status(413).json({ error: 'ข้อมูลใหญ่เกินไป (ไฟล์ไม่เกิน 20 MB)' });
  if (error instanceof SyntaxError && error.status === 400)
    return res.status(400).json({ error: 'JSON ไม่ถูกต้อง' });
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  // Do not expose queries, credentials, or document content in responses/logs.
  console.error('API failure:', error.code || error.name);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่' });
}
