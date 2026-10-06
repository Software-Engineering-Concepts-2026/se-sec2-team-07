import { HttpError } from '../shared/errors.js';
export function apiPolicy(config) {
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!['GET', 'HEAD'].includes(req.method)) {
      const origin = req.get('Origin');
      const ownOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin && origin !== ownOrigin && origin !== config.origin)
        return next(new HttpError(403, 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น'));
      if (!req.is('application/json')) return next(new HttpError(415, 'ต้องส่งข้อมูลแบบ JSON'));
    }
    next();
  };
}
