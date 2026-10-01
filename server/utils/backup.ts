import fs from 'fs';
import path from 'path';
import { DATA_DIR as SHARED_DATA_DIR } from './paths';

const DATA_DIR = SHARED_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'lostcamp.sqlite');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MAX_BACKUPS = 30;

// Only names like "lostcamp-2026-10-01-153000.sqlite" are ever touched/served.
const BACKUP_NAME_RE = /^lostcamp-[0-9A-Za-z_-]+\.sqlite$/;

export interface BackupInfo {
  name: string;
  size: number;
  createdAt: string; // ISO
}

export function isValidBackupName(name: string): boolean {
  return typeof name === 'string' && BACKUP_NAME_RE.test(name) && path.basename(name) === name;
}

export function getBackupPath(name: string): string | null {
  if (!isValidBackupName(name)) return null;
  const full = path.join(BACKUP_DIR, name);
  return fs.existsSync(full) ? full : null;
}

function makeBackupFileName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `lostcamp-${timestamp}.sqlite`;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function listBackupFiles(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => isValidBackupName(file))
    .sort();
}

function rotateBackups(): void {
  const backupFiles = listBackupFiles();
  if (backupFiles.length > MAX_BACKUPS) {
    const filesToDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`[BACKUP CLEANUP] Deleted old backup: ${file}`);
      } catch (err) {
        console.error(`[BACKUP CLEANUP] Failed to delete ${file}:`, err);
      }
    }
  }
}

export function listBackups(): BackupInfo[] {
  return listBackupFiles()
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .reverse(); // newest first
}

// Writes the given SQLite file contents as a new backup and returns its info.
export function saveBackupBuffer(buffer: Buffer): BackupInfo {
  ensureBackupDir();
  let name = makeBackupFileName();
  // Two backups within the same second must not overwrite each other.
  let n = 1;
  while (fs.existsSync(path.join(BACKUP_DIR, name))) {
    name = makeBackupFileName().replace('.sqlite', `-${n++}.sqlite`);
  }
  const target = path.join(BACKUP_DIR, name);
  fs.writeFileSync(target, buffer);
  console.log(`[BACKUP SUCCESS] Database backed up to ${target}`);
  rotateBackups();
  const stat = fs.statSync(target);
  return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
}

export function deleteBackup(name: string): boolean {
  const full = getBackupPath(name);
  if (!full) return false;
  fs.unlinkSync(full);
  return true;
}

// Automatic (startup + every 24h) backup: copies the database file.
export function backupDatabase(): void {
  try {
    if (!fs.existsSync(DB_FILE)) {
      console.log('[BACKUP] Source database file does not exist yet. Skipping backup.');
      return;
    }
    saveBackupBuffer(fs.readFileSync(DB_FILE));
  } catch (err) {
    console.error('[BACKUP ERROR] Failed to create database backup:', err);
  }
}
