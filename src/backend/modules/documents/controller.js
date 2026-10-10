import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { fileSchema, idSchema } from '../../shared/validation.js';
import { extractDocument } from '../generation/extract.js';

const titleSchema = z.string().trim().min(1).max(120);
const uploadSchema = fileSchema.extend({ title: titleSchema.optional() });
const renameSchema = z.object({ title: titleSchema });

export function documentController(repo) {
  const router = Router();
  const uploadLimit = rateLimit({
    windowMs: 60000,
    limit: 10,
    keyGenerator: (req) => String(req.user.id),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'กรุณารอสักครู่ก่อนอัปโหลดเอกสารเพิ่ม' },
  });
  router.get('/', async (req, res) => res.json({ documents: await repo.list(req.user.id) }));
  router.post('/', uploadLimit, async (req, res) => {
    const input = uploadSchema.parse(req.body);
    // Extract before persisting: rejected and unreadable files leave no record.
    const body = await extractDocument(input);
    const name = input.name
      .replaceAll('\\', '/')
      .split('/')
      .pop()
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim();
    const title = titleSchema.parse(input.title ?? name.replace(/\.[^.]+$/, '').slice(0, 120));
    const id = await repo.create(req.user.id, {
      title,
      name,
      body,
      content: Buffer.from(input.content, 'base64'),
    });
    res.status(201).json({ id });
  });
  router.get('/:id/download', async (req, res) => {
    const file = await repo.download(req.user.id, idSchema.parse(req.params.id));
    res.attachment(file.name).type('application/octet-stream').send(file.content);
  });
  router.put('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id),
      { title } = renameSchema.parse(req.body);
    await repo.rename(req.user.id, id, title);
    res.json({ id });
  });
  router.delete('/:id', async (req, res) => {
    await repo.remove(req.user.id, idSchema.parse(req.params.id));
    res.json({ ok: true });
  });
  return router;
}
