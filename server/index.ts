import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import datasetsRouter from './routes/datasets.js';
import publicDatasetsRouter from './routes/publicDatasets.js';
import analyticsRouter from './routes/analytics.js';
import usersRouter from './routes/users.js';

// Initialize DB (runs schema creation on import)
import './db/sqlite.js';

const app = express();
const PORT = 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/admin', authRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/public/datasets', publicDatasetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', usersRouter);

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Admin API server listening on http://localhost:${PORT}`);
});

export default app;
