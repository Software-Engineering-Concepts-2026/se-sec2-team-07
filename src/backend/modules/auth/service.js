import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../shared/errors.js';

const derive = promisify(scrypt);
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded || '')) return false;
  const computed = await hashPassword(password, encoded.split(':')[0]);
  return timingSafeEqual(Buffer.from(computed), Buffer.from(encoded));
}
export function authService(repo, config) {
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: config.cookieSecure, path: '/' };
  const issue = user => jwt.sign({ ver: user.token_version }, config.jwtSecret,
    { algorithm: 'HS256', subject: String(user.id), issuer: 'focus-flashcards', audience: 'focus-web', expiresIn: '30m' });
  return {
    cookieOptions,
    async register(input) {
      try { return await repo.create({ ...input, password: await hashPassword(input.password) }); }
      catch (error) { if (['23505', 'P2002'].includes(error.code)) throw new HttpError(409, 'อีเมลนี้ถูกใช้แล้ว'); throw error; }
    },
    async login(input) {
      const user = await repo.byEmail(input.email);
      const dummy = `${'0'.repeat(32)}:${'0'.repeat(128)}`;
      if (!await verifyPassword(input.password, user?.password || dummy) || !user) throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return user;
    },
    setCookie(res, user) { res.cookie('focus_token', issue(user), cookieOptions); },
    async logout(res, user) {
      // Invalidates previously issued tokens as well as removing this browser's cookie.
      await repo.revoke(user.id);
      res.clearCookie('focus_token', cookieOptions);
    },
    async authenticate(req, res, next) {
      try {
        const token = jwt.verify(req.cookies.focus_token || '', config.jwtSecret,
          { algorithms: ['HS256'], issuer: 'focus-flashcards', audience: 'focus-web' });
        if (!/^\d+$/.test(token.sub)) throw new Error('Invalid subject');
        const user = await repo.byId(Number(token.sub));
        if (!user || token.ver !== user.token_version) throw new Error('Revoked');
        req.user = user;
        // Sliding 30-minute inactivity timeout, with no server-side session store.
        res.cookie('focus_token', issue(user), cookieOptions);
        next();
      } catch (error) {
        if (error.code?.startsWith('08') || error.code?.startsWith('P') || error.code === 'ECONNREFUSED') return next(error);
        next(new HttpError(401, 'กรุณาเข้าสู่ระบบอีกครั้ง'));
      }
    },
  };
}
