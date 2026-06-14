import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';
import * as datasetService from '../services/datasetService.js';

const router = Router();

// All dataset routes require authentication
router.use(authMiddleware);

// POST /api/datasets — upload a CSV or JSON file
router.post('/', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded. Provide a file field named "file".' });
    return;
  }

  try {
    const meta = datasetService.parseAndStore(req.file);
    res.status(201).json(meta);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    const status = e.status ?? 400;
    res.status(status).json({ error: e.message ?? 'Failed to process file.' });
  }
});

// GET /api/datasets — list all datasets
router.get('/', (_req: Request, res: Response): void => {
  const datasets = datasetService.getAll();
  res.json(datasets);
});

// GET /api/datasets/:id — get dataset meta + schema
router.get('/:id', (req: Request, res: Response): void => {
  const result = datasetService.getById(req.params['id'] as string);
  if (!result) {
    res.status(404).json({ error: 'Dataset not found.' });
    return;
  }
  res.json(result);
});

// GET /api/datasets/:id/rows — get actual row data for a dataset
router.get('/:id/rows', (req: Request, res: Response): void => {
  const rows = datasetService.getRows(req.params['id'] as string);
  res.json({ rows });
});

// DELETE /api/datasets/:id — delete a dataset
router.delete('/:id', (req: Request, res: Response): void => {
  const deleted = datasetService.deleteById(req.params['id'] as string);
  if (!deleted) {
    res.status(404).json({ error: 'Dataset not found.' });
    return;
  }
  res.status(204).send();
});

export default router;
