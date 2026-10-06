import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { credentialsSchema, registerSchema } from '../../shared/validation.js';

export function authController(auth, limit = 20) {
  const router = Router();
  router.use(
    ['/register', '/login'],
    rateLimit({
      windowMs: 300000,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ 5 นาที' },
    }),
  );
  router.post('/register', async (req, res) => {
    const user = await auth.register(registerSchema.parse(req.body));
    auth.setCookie(res, user);
    res.status(201).json({ ok: true });
  });
  router.post('/login', async (req, res) => {
    const user = await auth.login(credentialsSchema.parse(req.body));
    auth.setCookie(res, user);
    res.json({ ok: true });
  });
  return router;
}
