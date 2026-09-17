import { z } from 'zod';
import { Router } from 'express';
import { idSchema, reviewSchema } from '../../shared/validation.js';
export function reviewController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await repo.plan(req.user.id, req.query.deck ? idSchema.parse(req.query.deck) : null)));
  router.get('/plan', async (req, res) => res.json(await repo.plan(req.user.id)));
  router.put('/plan', async (req, res) => {
    const { minutes } = z.object({ minutes: z.number().int().min(1).max(120) }).parse(req.body);
    await repo.setMinutes(req.user.id, minutes);
    res.json(await repo.plan(req.user.id));
  });
  router.post('/', async (req, res) => res.json(await repo.record(req.user.id, reviewSchema.parse(req.body))));
  return router;
}
