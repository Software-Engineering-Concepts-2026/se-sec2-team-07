import { Router } from 'express';
import { summarize } from './service.js';
export function statsController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json(summarize(await repo.history(req.user.id))));
  return router;
}
