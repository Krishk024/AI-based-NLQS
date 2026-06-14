import { Router, Request, Response } from 'express';
import * as datasetService from '../services/datasetService.js';

const router = Router();

// GET /api/public/datasets — no auth, returns all dataset metadata for regular users
router.get('/', (_req: Request, res: Response): void => {
  const datasets = datasetService.getAll();
  res.json(datasets);
});

// GET /api/public/datasets/:id — no auth, returns schema for a specific dataset
router.get('/:id', (req: Request, res: Response): void => {
  const result = datasetService.getById(req.params['id'] as string);
  if (!result) {
    res.status(404).json({ error: 'Dataset not found.' });
    return;
  }
  res.json(result);
});

export default router;
