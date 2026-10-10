import { Router } from 'express';
import { summarize } from './service.js';
export function statsController(repo, decks) {
  const router = Router();
  router.get('/overview', async (req, res) => {
    const [history, list] = await Promise.all([repo.history(req.user.id), decks.list(req.user.id)]);
    res.json({ stats: summarize(history), decks: list });
  });
  router.get('/', async (req, res) => res.json(summarize(await repo.history(req.user.id))));
  return router;
}
