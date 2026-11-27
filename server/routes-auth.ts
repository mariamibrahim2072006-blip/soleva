import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { sql } from './db.js';
import { signToken, requireAuth, type AuthedRequest } from './auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  full_name: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
});

function publicUser(u: any) {
  return { id: u.id, email: u.email, full_name: u.full_name, phone: u.phone, role: u.role, created_at: u.created_at };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input', details: parsed.error.issues });
  const { email, password, full_name, phone } = parsed.data;
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length) return res.status(409).json({ error: 'email_taken' });
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`INSERT INTO users (email, password_hash, full_name, phone) VALUES (${email.toLowerCase()}, ${hash}, ${full_name}, ${phone ?? null}) RETURNING *`;
  const user = rows[0];
  res.status(201).json({ token: signToken(user as any), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const rows = await sql`SELECT * FROM users WHERE email = ${parsed.data.email.toLowerCase()}`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash as string))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  res.json({ token: signToken(user as any), user: publicUser(user) });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`SELECT * FROM users WHERE id = ${req.user!.id}`;
  res.json({ user: publicUser(rows[0]) });
});

authRouter.put('/me', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    full_name: z.string().min(2).max(120).optional(),
    phone: z.string().max(30).optional(),
    current_password: z.string().optional(),
    new_password: z.string().min(8).max(100).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const { full_name, phone, current_password, new_password } = parsed.data;
  const rows = await sql`SELECT * FROM users WHERE id = ${req.user!.id}`;
  const user = rows[0];
  if (new_password) {
    if (!current_password || !(await bcrypt.compare(current_password, user.password_hash as string))) {
      return res.status(400).json({ error: 'wrong_current_password' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${req.user!.id}`;
  }
  const updated = await sql`UPDATE users SET full_name = COALESCE(${full_name ?? null}, full_name), phone = COALESCE(${phone ?? null}, phone) WHERE id = ${req.user!.id} RETURNING *`;
  res.json({ user: publicUser(updated[0]) });
});

// Forgot password: creates a reset token. There is no SMTP in this deployment,
// so in demo mode the reset URL is returned directly (documented in README).
authRouter.post('/forgot', async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const rows = await sql`SELECT id FROM users WHERE email = ${parsed.data.email.toLowerCase()}`;
  let reset_url: string | undefined;
  if (rows[0]) {
    const token = crypto.randomBytes(32).toString('hex');
    await sql`INSERT INTO password_resets (user_id, token, expires_at) VALUES (${rows[0].id}, ${token}, now() + interval '1 hour')`;
    reset_url = `/reset-password?token=${token}`;
  }
  res.json({ ok: true, demo_reset_url: reset_url });
});

authRouter.post('/reset', async (req, res) => {
  const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(100) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const rows = await sql`SELECT * FROM password_resets WHERE token = ${parsed.data.token} AND used = false AND expires_at > now()`;
  if (!rows[0]) return res.status(400).json({ error: 'invalid_or_expired_token' });
  const hash = await bcrypt.hash(parsed.data.password, 10);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${rows[0].user_id}`;
  await sql`UPDATE password_resets SET used = true WHERE id = ${rows[0].id}`;
  res.json({ ok: true });
});
