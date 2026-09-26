import { Router } from 'express';
import { exportSchema, createExport } from './service.js';

export function exportController(repo) {
  const router = Router();
  router.post('/', async (req, res) => {
    const input = exportSchema.parse(req.body);
    res.json(createExport(await repo.snapshot(req.user.id, input), input));
  });
  return router;
}
