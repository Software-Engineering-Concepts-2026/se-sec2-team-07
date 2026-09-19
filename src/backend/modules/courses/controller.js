import { Router } from 'express';
import { z } from 'zod';
import { idSchema } from '../../shared/validation.js';
const courseSchema = z.object({ name: z.string().trim().min(1).max(120) });
const noteSchema = z.object({ title: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(60000) });

export function courseController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json({ courses: await repo.list(req.user.id) }));
  router.get('/library', async (req, res) => res.json(await repo.library(req.user.id)));
  router.post('/', async (req, res) => res.status(201).json({ id: await repo.save(req.user.id, null, courseSchema.parse(req.body)) }));
  router.get('/:id', async (req, res) => res.json(await repo.get(req.user.id, idSchema.parse(req.params.id))));
  router.put('/:id', async (req, res) => res.json({ id: await repo.save(req.user.id, idSchema.parse(req.params.id), courseSchema.parse(req.body)) }));
  router.delete('/:id', async (req, res) => { await repo.remove(req.user.id, idSchema.parse(req.params.id)); res.json({ ok: true }); });
  for (const kind of ['cards', 'notes']) {
    for (const method of ['put', 'delete']) router[method](`/:id/${kind}/:sourceId`, async (req, res) => {
      await repo.link(req.user.id, idSchema.parse(req.params.id), kind, idSchema.parse(req.params.sourceId), method === 'put');
      res.json({ ok: true });
    });
  }
  return router;
}

export function noteController(repo) {
  const router = Router();
  router.get('/', async (req, res) => res.json({ notes: await repo.list(req.user.id) }));
  router.post('/', async (req, res) => res.status(201).json({ id: await repo.save(req.user.id, null, noteSchema.parse(req.body)) }));
  router.put('/:id', async (req, res) => res.json({ id: await repo.save(req.user.id, idSchema.parse(req.params.id), noteSchema.parse(req.body)) }));
  router.delete('/:id', async (req, res) => { await repo.remove(req.user.id, idSchema.parse(req.params.id)); res.json({ ok: true }); });
  return router;
}
