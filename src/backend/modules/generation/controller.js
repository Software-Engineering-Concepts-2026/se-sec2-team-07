import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { fileSchema, generationSchema } from '../../shared/validation.js';
import { generate } from './service.js';
import { extractDocument } from './extract.js';
export function generationController(config) {
  const router = Router();
  router.use(
    rateLimit({
      windowMs: 60000,
      limit: 10,
      keyGenerator: (req) => String(req.user.id),
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'กรุณารอสักครู่ก่อนสร้างการ์ดเพิ่ม' },
    }),
  );
  router.post('/extract', async (req, res) =>
    res.json(await extractDocument(fileSchema.parse(req.body), { detailed: true })),
  );
  router.post('/generate', async (req, res) =>
    res.json({ cards: await generate(generationSchema.parse(req.body), config) }),
  );
  return router;
}
