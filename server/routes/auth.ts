import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/sqlite.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AdminTokenPayload } from '../types.js';

const router = Router();

// POST /api/admin/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body ?? {};

  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  const secret = process.env.JWT_SECRET ?? '';

  if (!adminEmail || !adminPassword || !secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  // Use timingSafeEqual to prevent timing attacks
  let emailMatch = false;
  let passwordMatch = false;

  try {
    const emailBuf = Buffer.from(String(email ?? ''));
    const adminEmailBuf = Buffer.from(adminEmail);
    // Buffers must be same length for timingSafeEqual
    if (emailBuf.length === adminEmailBuf.length) {
      emailMatch = crypto.timingSafeEqual(emailBuf, adminEmailBuf);
    }

    const passwordBuf = Buffer.from(String(password ?? ''));
    const adminPasswordBuf = Buffer.from(adminPassword);
    if (passwordBuf.length === adminPasswordBuf.length) {
      passwordMatch = crypto.timingSafeEqual(passwordBuf, adminPasswordBuf);
    }
  } catch {
    // Fall through — emailMatch/passwordMatch remain false
  }

  if (!emailMatch || !passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const jti = uuidv4();
  const payload: AdminTokenPayload & { jti: string } = {
    sub: 'admin',
    jti,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 hours
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  res.json({ token });
});

// POST /api/admin/logout
router.post('/logout', authMiddleware, (req: Request, res: Response): void => {
  const jti = req.admin?.jti;
  if (jti) {
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (jti, revoked_at) VALUES (?, ?)').run(
      jti,
      Date.now()
    );
  }
  res.json({ message: 'Logged out' });
});

export default router;
