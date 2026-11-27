import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sql } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'soleva-dev-secret-change-me';
const TOKEN_TTL = '30d';

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string; full_name: string };
}

export function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      const rows = await sql`SELECT id, email, role, full_name FROM users WHERE id = ${payload.sub}`;
      if (rows[0]) req.user = rows[0] as AuthedRequest['user'];
    } catch { /* invalid token: continue as guest */ }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'authentication_required' });
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'authentication_required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin_required' });
  next();
}
