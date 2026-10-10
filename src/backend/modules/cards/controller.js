import { Router } from 'express';
import { z } from 'zod';
import { idSchema } from '../../shared/validation.js';

const listSchema = z.object({ archived: z.enum(['true', 'false']).default('false') }).strict();
const archiveSchema = z.object({ archived: z.boolean() }).strict();

export function cardController(repo) {
  const router = Router();
  router.get('/', async (req, res) => {
    const { archived } = listSchema.parse(req.query);
    res.json({ cards: await repo.list(req.user.id, archived === 'true') });
  });
  router.put('/:id/archive', async (req, res) => {
    const { archived } = archiveSchema.parse(req.body);
    await repo.archive(req.user.id, idSchema.parse(req.params.id), archived);
    res.json({ ok: true });
  });
  return router;
}
