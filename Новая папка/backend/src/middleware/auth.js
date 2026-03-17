import jwt from 'jsonwebtoken';
import { isAdminEmail } from '../utils/adminStore.js';

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export async function adminRequired(req, res, next) {
  const email = req.user?.email;
  const isAdmin = await isAdminEmail(email);

  if (!isAdmin) {
    return res.status(403).json({ error: req.query.lang === 'ru' ? 'Недостаточно прав.' : 'Insufficient permissions.' });
  }

  return next();
}
