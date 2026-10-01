import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db } from './dbHelper';
import { requireAdmin } from './auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { createRateLimiter } from '../middleware/rateLimiter';
import { notifyAdmin, escapeHtml } from '../utils/mailer';
import { UPLOADS_DIR } from '../utils/paths';

const router = Router();

const reviewLimiter = createRateLimiter(5, 15 * 60 * 1000, 'Слишком много отзывов отправлено. Попробуйте позже.');

function checkReviewRateLimit(req: any, res: any, next: any) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (reviewLimiter.isBlocked(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Слишком много отзывов отправлено. Попробуйте позже.',
    });
  }
  next();
}

const uploadDir = path.join(UPLOADS_DIR, 'reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new AppError('Разрешены только изображения форматов JPEG, PNG и WebP.', 400));
  }
};

const reviewUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit per file
    files: 5, // max 5 files
  },
  fileFilter,
});

function validateProductData(item: any, index?: number, isUpdateSingle: boolean = false) {
  const prefix = typeof index === 'number' ? `Ошибка в товаре №${index + 1}: ` : '';

  if (!item || typeof item !== 'object') {
    throw new AppError(`${prefix}Товар должен быть объектом`, 400);
  }

  // title: обязательная непустая строка (после trim())
  if (!isUpdateSingle || item.title !== undefined) {
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (!title) {
      throw new AppError(`${prefix}не указано название товара`, 400);
    }
  }

  // price: обязательное значение, привести через Number(), должно быть isFinite и > 0
  if (!isUpdateSingle || item.price !== undefined) {
    if (item.price === undefined || item.price === null || item.price === '') {
      throw new AppError(`${prefix}не указана цена товара`, 400);
    }
    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new AppError(`${prefix}цена должна быть положительным числом`, 400);
    }
  }

  // oldPrice: если передан (не undefined/null)
  if (item.oldPrice !== undefined && item.oldPrice !== null && item.oldPrice !== '') {
    const oldPrice = Number(item.oldPrice);
    if (!Number.isFinite(oldPrice) || oldPrice < 0) {
      throw new AppError(`${prefix}старая цена должна быть неотрицательным числом`, 400);
    }
  }

  // category: обязательная непустая строка
  if (!isUpdateSingle || item.category !== undefined) {
    const category = typeof item.category === 'string' ? item.category.trim() : '';
    if (!category) {
      throw new AppError(`${prefix}не указана категория товара`, 400);
    }
  }

  // inStock: если передан — привести к boolean
  if (item.inStock !== undefined) {
    item.inStock = Boolean(item.inStock);
  }

  // isPromo: если передан — привести к boolean
  if (item.isPromo !== undefined) {
    item.isPromo = Boolean(item.isPromo);
  }
}

// GET all products (public)
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const products = await db.getProducts();
    res.json(products);
  })
);

// POST save products list or create single product (admin protected)
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (Array.isArray(body)) {
      body.forEach((item, idx) => validateProductData(item, idx));
      await db.saveProducts(body);
      return res.json(body);
    }
    validateProductData(body);
    const created = await db.addProduct(body);
    res.json(created);
  })
);

// PUT update all products or single product by ID (admin protected)
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (Array.isArray(body)) {
      body.forEach((item, idx) => validateProductData(item, idx));
      await db.saveProducts(body);
      return res.json(body);
    }
    validateProductData(body);
    if (body.id) {
      const updated = await db.updateProduct(Number(body.id), body);
      res.json(updated);
    } else {
      await db.saveProducts(body);
      const products = await db.getProducts();
      res.json(products);
    }
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const updatedProduct = req.body;
    validateProductData(updatedProduct, undefined, true);

    const updated = await db.updateProduct(id, updatedProduct);
    res.json(updated);
  })
);

// DELETE a product by ID (admin protected)
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await db.deleteProduct(id);
    res.json({ success: true, id });
  })
);

// GET /api/products/:id/reviews
router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.id);
    const reviews = await db.getReviewsByProduct(productId);
    res.json(reviews);
  })
);

// POST /api/products/:id/reviews
router.post(
  '/:id/reviews',
  checkReviewRateLimit,
  reviewUpload.array('photos', 5),
  asyncHandler(async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    reviewLimiter.recordFailed(clientIp);

    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      throw new AppError('Некорректный ID товара', 400);
    }

    const { userName, rating, text, date } = req.body;
    let parsedRating = 5;
    if (rating !== undefined && rating !== null && rating !== '') {
      const num = Number(rating);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        throw new AppError('Рейтинг должен быть целым числом от 1 до 5', 400);
      }
      parsedRating = num;
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const photoPaths = files.map((file) => `/uploads/reviews/${file.filename}`);

    let finalPhotos: string[] = photoPaths;
    if (finalPhotos.length === 0 && req.body.photos) {
      if (Array.isArray(req.body.photos)) {
        finalPhotos = req.body.photos;
      } else if (typeof req.body.photos === 'string') {
        try {
          finalPhotos = JSON.parse(req.body.photos);
        } catch {
          finalPhotos = [req.body.photos];
        }
      }
    }

    const newReview = await db.addReview({
      productId,
      userName: userName || 'Покупатель',
      rating: parsedRating,
      text: text || '',
      photos: finalPhotos,
      date: date || new Date().toLocaleDateString('ru-RU'),
    });

    // Send admin notification email fire-and-forget
    const reviewAttachments = files.map((f) => ({
      filename: f.originalname,
      path: f.path,
    }));

    const stars = '★'.repeat(parsedRating) + '☆'.repeat(5 - parsedRating);

    const safeUserName = escapeHtml(userName || 'Покупатель');
    const safeText = escapeHtml(text || 'Без текста');

    const reviewHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #34d399; margin-top: 0; border-bottom: 1px solid #2e4733; padding-bottom: 12px;">LOST CAMP — Новый отзыв на товар #${productId}</h2>
        <p style="margin-bottom: 8px;"><strong style="color: #a7f3d0;">Автор:</strong> ${safeUserName}</p>
        <p style="margin-bottom: 12px;"><strong style="color: #a7f3d0;">Оценка:</strong> <span style="color: #f59e0b; font-size: 16px;">${stars}</span> (${parsedRating}/5)</p>
        <p style="margin-bottom: 16px;"><strong style="color: #a7f3d0;">Текст отзыва:</strong></p>
        <div style="background-color: #1a2e20; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${safeText}</div>
        ${reviewAttachments.length > 0 ? `<p style="margin-top: 16px; font-size: 13px; color: #a7f3d0;">Загружено фото: ${reviewAttachments.length} шт. (прикреплены к письму)</p>` : ''}
        <p style="margin-top: 24px; font-size: 12px; color: #888888;">Дата: ${newReview.date || new Date().toLocaleDateString('ru-RU')}</p>
      </div>
    `;

    notifyAdmin(
      `Новый отзыв на товар #${productId}`,
      reviewHtml,
      reviewAttachments.length > 0 ? reviewAttachments : undefined
    ).catch((err) => {
      console.error('Error sending review notification email:', err);
    });

    res.json(newReview);
  })
);

export default router;
