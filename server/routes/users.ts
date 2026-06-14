import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import db from '../db/sqlite.js';
import type { UserRecord } from '../types.js';

const router = Router();

function rowToUserRecord(row: {
  id: number;
  name: string;
  email: string;
  created_at: number;
  last_login: number;
  is_active: number;
}): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    isActive: row.is_active === 1,
  };
}

// GET /api/users — return all users
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      'SELECT id, name, email, created_at, last_login, is_active FROM users ORDER BY created_at DESC'
    )
    .all() as Array<{
      id: number;
      name: string;
      email: string;
      created_at: number;
      last_login: number;
      is_active: number;
    }>;

  res.json(rows.map(rowToUserRecord));
});

// PATCH /api/users/:id/status — update is_active
router.patch('/:id/status', authMiddleware, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const { isActive } = req.body as { isActive?: unknown };
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ error: 'isActive must be a boolean' });
    return;
  }

  const result = db
    .prepare('UPDATE users SET is_active = ? WHERE id = ?')
    .run(isActive ? 1 : 0, id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const updated = db
    .prepare(
      'SELECT id, name, email, created_at, last_login, is_active FROM users WHERE id = ?'
    )
    .get(id) as
    | {
        id: number;
        name: string;
        email: string;
        created_at: number;
        last_login: number;
        is_active: number;
      }
    | undefined;

  res.json(rowToUserRecord(updated!));
});

// POST /api/users/sync — upsert user into mirror table (no auth required)
router.post('/sync', (req: Request, res: Response) => {
  const { name, email, createdAt, lastLogin } = req.body as {
    name?: unknown;
    email?: unknown;
    createdAt?: unknown;
    lastLogin?: unknown;
  };

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof createdAt !== 'number' ||
    typeof lastLogin !== 'number'
  ) {
    res.status(400).json({ error: 'name, email, createdAt, lastLogin are required' });
    return;
  }

  db.prepare(
    `INSERT INTO users (name, email, created_at, last_login, is_active)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       last_login = excluded.last_login`
  ).run(name, email, createdAt, lastLogin);

  const row = db
    .prepare(
      'SELECT id, name, email, created_at, last_login, is_active FROM users WHERE email = ?'
    )
    .get(email) as {
    id: number;
    name: string;
    email: string;
    created_at: number;
    last_login: number;
    is_active: number;
  };

  res.json(rowToUserRecord(row));
});

export default router;
