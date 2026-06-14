import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getCached, computeSummary } from '../services/analyticsService.js';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', authMiddleware, (req: Request, res: Response) => {
  const totalQueries = Math.max(0, Number(req.query.totalQueries) || 0);
  const successCount = Math.max(0, Number(req.query.successCount) || 0);

  const cached = getCached();
  if (cached) {
    res.json(cached);
    return;
  }

  const summary = computeSummary(totalQueries, successCount);
  res.json(summary);
});

export default router;
