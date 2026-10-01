import { Router, Request, Response } from 'express';
import { db } from './dbHelper';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

const VALID_MEDIA_LAYOUTS = [
  '1_photo',
  '2_photo',
  '3_photo',
  '1_photo_1_video',
  '2_photo_1_video',
  '1_video',
];

// GET /api/news - list all news articles
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const newsList = await db.getNews();
    res.json(newsList);
  })
);

// GET /api/news/:id - get single article
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Некорректный ID новости', 400);
    }
    const article = await db.getNewsById(id);
    if (!article) {
      throw new AppError('Новость не найдена', 404);
    }
    res.json(article);
  })
);

// POST /api/news - create news article (admin protected)
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { title, subtitle, date, tags, content, mediaLayout, image1, image2, image3, videoUrl, coverImage, coverFocalPoint } = req.body;
    if (!title || !content) {
      throw new AppError('Заголовок и содержание новости обязательны', 400);
    }

    if (mediaLayout !== undefined && mediaLayout !== null && mediaLayout !== '') {
      if (!VALID_MEDIA_LAYOUTS.includes(mediaLayout)) {
        throw new AppError('Недопустимое значение mediaLayout', 400);
      }
    }

    const created = await db.createNewsArticle({
      title,
      subtitle: subtitle || '',
      date: date || new Date().toLocaleDateString('ru-RU'),
      tags: tags || '',
      content,
      mediaLayout: mediaLayout || '1_photo',
      image1: image1 || '',
      image2: image2 || '',
      image3: image3 || '',
      videoUrl: videoUrl || '',
      coverImage: coverImage || '',
      coverFocalPoint: coverFocalPoint || undefined,
    });

    res.json({
      success: true,
      data: created,
    });
  })
);

// PUT /api/news/:id - update news article (admin protected)
router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Некорректный ID новости', 400);
    }

    const { title, subtitle, date, tags, content, mediaLayout, image1, image2, image3, videoUrl, coverImage, coverFocalPoint } = req.body;

    if (mediaLayout !== undefined && mediaLayout !== null && mediaLayout !== '') {
      if (!VALID_MEDIA_LAYOUTS.includes(mediaLayout)) {
        throw new AppError('Недопустимое значение mediaLayout', 400);
      }
    }

    const updated = await db.updateNewsArticle(id, {
      title,
      subtitle,
      date,
      tags,
      content,
      mediaLayout,
      image1,
      image2,
      image3,
      videoUrl,
      coverImage,
      coverFocalPoint,
    });

    if (!updated) {
      throw new AppError('Новость не найдена', 404);
    }

    res.json({
      success: true,
      data: updated,
    });
  })
);

// DELETE /api/news/:id - delete news article (admin protected)
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Некорректный ID новости', 400);
    }

    const success = await db.deleteNewsArticle(id);
    if (!success) {
      throw new AppError('Новость не найдена или уже была удалена', 404);
    }

    res.json({
      success: true,
      message: 'Новость успешно удалена',
      id,
    });
  })
);

export default router;
