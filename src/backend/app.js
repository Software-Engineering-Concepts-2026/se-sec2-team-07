import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { apiPolicy } from './middleware/api-policy.js';
import { authRepository } from './modules/auth/repository.js';
import { authService } from './modules/auth/service.js';
import { authController } from './modules/auth/controller.js';
import { deckRepository } from './modules/decks/repository.js';
import { deckController } from './modules/decks/controller.js';
import { cardRepository } from './modules/cards/repository.js';
import { cardController } from './modules/cards/controller.js';
import { reviewRepository } from './modules/reviews/repository.js';
import { reviewController } from './modules/reviews/controller.js';
import { statsRepository } from './modules/stats/repository.js';
import { statsController } from './modules/stats/controller.js';
import { exportRepository } from './modules/exports/repository.js';
import { exportController } from './modules/exports/controller.js';
import { generationController } from './modules/generation/controller.js';
import { documentRepository } from './modules/documents/repository.js';
import { documentController } from './modules/documents/controller.js';
import { courseRepository, noteRepository } from './modules/courses/repository.js';
import { courseController, noteController } from './modules/courses/controller.js';

export function createApp(pool, config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
      strictTransportSecurity: config.production ? undefined : false,
    }),
  );
  app.use(compression());
  app.use('/api', apiPolicy(config));
  app.use(express.json({ limit: '29mb' }));
  app.use(cookieParser());
  app.get('/api/health', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  });
  const auth = authService(authRepository(pool), config);
  app.use('/api', authController(auth, config.production ? 20 : (config.authRateLimit ?? 20)));
  app.use('/api', auth.authenticate);
  app.get('/api/me', (req, res) => {
    const { id, name, email } = req.user;
    res.json({ user: { id, name, email }, ai: Boolean(config.aiKey && config.aiModel) });
  });
  app.post('/api/logout', async (req, res) => {
    await auth.logout(res, req.user);
    res.json({ ok: true });
  });
  app.use('/api/decks', deckController(deckRepository(pool)));
  app.use('/api/cards', cardController(cardRepository(pool)));
  app.use('/api/courses', courseController(courseRepository(pool)));
  app.use('/api/notes', noteController(noteRepository(pool)));
  app.use('/api/documents', documentController(documentRepository(pool)));
  app.use('/api/review', reviewController(reviewRepository(pool)));
  app.use('/api/stats', statsController(statsRepository(pool), deckRepository(pool)));
  app.use('/api/exports', exportController(exportRepository(pool)));
  const generation = generationController(config);
  app.use('/api', generation);
  app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ API' }));
  const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
  if (existsSync(dist)) {
    app.use(
      '/assets',
      express.static(`${dist}/assets`, { dotfiles: 'deny', maxAge: '1y', immutable: true }),
    );
    app.use(
      express.static(dist, {
        dotfiles: 'deny',
        setHeaders(res, path) {
          if (path.endsWith('.html')) res.set('Cache-Control', 'no-cache');
        },
      }),
    );
    app.get('/', (req, res) => res.sendFile(`${dist}/index.html`));
  } else
    app.get('/', (req, res) =>
      res.status(503).send('Frontend not built. Run npm run dev or npm run build.'),
    );
  app.use(errorHandler);
  return app;
}
