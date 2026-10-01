import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth';
import { exportDatabaseBuffer, replaceDatabase } from './dbHelper';
import {
  listBackups,
  saveBackupBuffer,
  getBackupPath,
  deleteBackup,
  isValidBackupName,
} from '../utils/backup';
import fs from 'fs';

const router = Router();

// Restore-from-file uploads are kept in memory (validated before touching disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

function timestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// GET /api/backup — list stored backups (newest first)
router.get('/', requireAdmin, (_req, res) => {
  try {
    res.json({ success: true, backups: listBackups() });
  } catch (err) {
    console.error('[BACKUP] list failed:', err);
    res.status(500).json({ success: false, error: 'Не удалось получить список копий' });
  }
});

// POST /api/backup — create a backup of the live database right now
router.post('/', requireAdmin, async (_req, res) => {
  try {
    const buffer = await exportDatabaseBuffer();
    const backup = saveBackupBuffer(buffer);
    res.json({ success: true, backup });
  } catch (err) {
    console.error('[BACKUP] create failed:', err);
    res.status(500).json({ success: false, error: 'Не удалось создать резервную копию' });
  }
});

// GET /api/backup/download-current — download the live database as a file
router.get('/download-current', requireAdmin, async (_req, res) => {
  try {
    const buffer = await exportDatabaseBuffer();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lostcamp-${timestampForFile()}.sqlite"`
    );
    res.send(buffer);
  } catch (err) {
    console.error('[BACKUP] download-current failed:', err);
    res.status(500).json({ success: false, error: 'Не удалось выгрузить базу данных' });
  }
});

// GET /api/backup/download/:name — download a stored backup
router.get('/download/:name', requireAdmin, (req, res) => {
  const name = String(req.params.name);
  const full = getBackupPath(name);
  if (!full) {
    return res.status(404).json({ success: false, error: 'Копия не найдена' });
  }
  res.download(full, name);
});

// POST /api/backup/restore-upload — restore from an uploaded .sqlite file
router.post('/restore-upload', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не загружен' });
  }
  try {
    // Safety net: snapshot the current state before overwriting it.
    const safety = saveBackupBuffer(await exportDatabaseBuffer());
    await replaceDatabase(req.file.buffer);
    res.json({ success: true, safetyBackup: safety.name });
  } catch (err: any) {
    console.error('[BACKUP] restore-upload failed:', err);
    res.status(400).json({ success: false, error: err?.message || 'Не удалось восстановить базу' });
  }
});

// POST /api/backup/restore/:name — restore from a stored backup
router.post('/restore/:name', requireAdmin, async (req, res) => {
  const full = getBackupPath(String(req.params.name));
  if (!full) {
    return res.status(404).json({ success: false, error: 'Копия не найдена' });
  }
  try {
    const data = fs.readFileSync(full);
    // Safety net: snapshot the current state before overwriting it.
    const safety = saveBackupBuffer(await exportDatabaseBuffer());
    await replaceDatabase(data);
    res.json({ success: true, safetyBackup: safety.name });
  } catch (err: any) {
    console.error('[BACKUP] restore failed:', err);
    res.status(400).json({ success: false, error: err?.message || 'Не удалось восстановить базу' });
  }
});

// DELETE /api/backup/:name — delete a stored backup
router.delete('/:name', requireAdmin, (req, res) => {
  const name = String(req.params.name);
  if (!isValidBackupName(name)) {
    return res.status(400).json({ success: false, error: 'Некорректное имя файла' });
  }
  try {
    const ok = deleteBackup(name);
    if (!ok) return res.status(404).json({ success: false, error: 'Копия не найдена' });
    res.json({ success: true });
  } catch (err) {
    console.error('[BACKUP] delete failed:', err);
    res.status(500).json({ success: false, error: 'Не удалось удалить копию' });
  }
});

export default router;
