import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authService } from '../../src/backend/modules/auth/service.js';

test('valid sessions propagate database failures instead of expiring authentication', async () => {
  const config = { jwtSecret: 'x'.repeat(32), cookieSecure: true };
  const failure = Object.assign(new Error('connection failed'), { code: 'ETIMEDOUT' });
  const service = authService(
    {
      byId: async () => {
        throw failure;
      },
    },
    config,
  );
  const token = jwt.sign({ ver: 0 }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: '1',
    issuer: 'focus-flashcards',
    audience: 'focus-web',
    expiresIn: '30m',
  });
  let received;
  await service.authenticate({ cookies: { focus_token: token } }, {}, (error) => {
    received = error;
  });
  assert.equal(received, failure);
  await service.authenticate({ cookies: { focus_token: 'invalid' } }, {}, (error) => {
    received = error;
  });
  assert.equal(received.status, 401);
});
