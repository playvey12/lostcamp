import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './dbHelper';
import { requireAdmin } from '../middleware/auth';
import { UPLOADS_DIR } from '../utils/paths';

const router = Router();

const uploadsDir = UPLOADS_DIR;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `media-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// GET site config (video, history, hero banner)
router.get('/', async (_req, res) => {
  try {
    const site = await db.getSite();
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch site config' });
  }
});

// POST upload video file (admin protected)
router.post('/upload-video', requireAdmin, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const videoUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: videoUrl });
});

// POST upload image file (admin protected)
router.post('/upload-image', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Изображение не загружено' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// PUT update site config (admin protected)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const site = req.body;
    await db.saveSite(site);
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update site config' });
  }
});

export default router;

