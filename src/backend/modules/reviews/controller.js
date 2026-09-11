import { Router } from 'express';
import { idSchema, reviewSchema } from '../../shared/validation.js';
export function reviewController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json({ cards: await repo.due(req.user.id, req.query.deck ? idSchema.parse(req.query.deck) : null) }));
  router.post('/', async (req, res) => res.json(await repo.record(req.user.id, reviewSchema.parse(req.body))));
  return router;
}
