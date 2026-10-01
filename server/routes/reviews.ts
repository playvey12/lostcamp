import { Router, Request, Response } from 'express';
import { db } from './dbHelper';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// DELETE /api/reviews/:id (admin required)
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Некорректный ID отзыва', 400);
    }
    await db.deleteReview(id);
    res.json({ success: true, id });
  })
);

export default router;
