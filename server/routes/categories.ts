import { Router } from 'express';
import { db } from './dbHelper';
import { requireAdmin } from './auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

function validateCategoryItem(item: any, index?: number) {
  const prefix = typeof index === 'number' ? `Ошибка в категории №${index + 1}: ` : '';

  if (!item || typeof item !== 'object') {
    throw new AppError(`${prefix}Категория должна быть объектом`, 400);
  }

  const categoryId = typeof item.categoryId === 'string' ? item.categoryId.trim() : '';
  if (!categoryId) {
    throw new AppError(`${prefix}не указан categoryId`, 400);
  }

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) {
    throw new AppError(`${prefix}не указано название категории`, 400);
  }

  if (item.items !== undefined && item.items !== null) {
    if (!Array.isArray(item.items) || !item.items.every((x: any) => typeof x === 'string')) {
      throw new AppError(`${prefix}элементы категории (items) должны быть массивом строк`, 400);
    }
  }
}

// GET all categories
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await db.getCategories();
    res.json(categories);
  })
);

// POST update full categories array or create a single category
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (Array.isArray(body)) {
      body.forEach((item, idx) => validateCategoryItem(item, idx));
      await db.saveCategories(body);
      return res.json(body);
    }
    validateCategoryItem(body);
    const categories: any[] = await db.getCategories();
    // Check if category already exists
    const existingIndex = categories.findIndex(
      (c: any) => c.categoryId === body.categoryId
    );
    if (existingIndex >= 0) {
      categories[existingIndex] = body;
    } else {
      categories.push(body);
    }
    await db.saveCategories(categories);
    res.json(categories);
  })
);

// PUT update all categories
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (Array.isArray(body)) {
      body.forEach((item, idx) => validateCategoryItem(item, idx));
      await db.saveCategories(body);
      return res.json(body);
    }
    validateCategoryItem(body);
    await db.saveCategories(body);
    res.json(body);
  })
);

// DELETE a category by categoryId
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const id = decodeURIComponent(rawId).trim();

    await db.deleteCategory(id);
    const updatedCategories = await db.getCategories();
    res.json(updatedCategories);
  })
);

export default router;
