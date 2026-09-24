import { Router } from 'express';
import { deckSchema, idSchema, revisionSchema } from '../../shared/validation.js';
export function deckController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json({ decks: await repo.list(req.user.id) }));
  router.post('/', async (req, res) => res.status(201).json({ id: await repo.save(req.user.id, null, deckSchema.parse(req.body)) }));
  router.get('/:id', async (req, res) => res.json(await repo.get(req.user.id, idSchema.parse(req.params.id))));
  router.put('/:id', async (req, res) => res.json({ id: await repo.save(req.user.id, idSchema.parse(req.params.id), deckSchema.parse(req.body)) }));
  router.delete('/:id', async (req, res) => { await repo.remove(req.user.id, idSchema.parse(req.params.id), revisionSchema.parse(req.body ?? {}).revision); res.json({ ok: true }); });
  return router;
}
