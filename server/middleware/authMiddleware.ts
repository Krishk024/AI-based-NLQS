import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/sqlite.js';
import type { AdminTokenPayload } from '../types.js';

// Extend Express Request to carry the decoded admin payload
declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload & { jti?: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  let payload: AdminTokenPayload & { jti?: string };
  try {
    payload = jwt.verify(token, secret) as AdminTokenPayload & { jti?: string };
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Check revoked_tokens table
  if (payload.jti) {
    const revoked = db
      .prepare('SELECT 1 FROM revoked_tokens WHERE jti = ?')
      .get(payload.jti);
    if (revoked) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  req.admin = payload;
  next();
}
