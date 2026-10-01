import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Some hosting platforms (e.g. TimeWeb App Platform) run the process as a
 * non-root user whose home/app directory isn't writable. Writing runtime
 * data (SQLite db, uploads, logs) directly under process.cwd() then fails
 * with EACCES and crashes the server on boot.
 *
 * This picks process.cwd() when it's actually writable, and transparently
 * falls back to a directory under the OS temp dir otherwise, so the app
 * always has somewhere to write instead of crashing.
 *
 * Note: on platforms with an ephemeral filesystem, data written here may
 * not survive a redeploy/restart regardless of which path is used — for
 * durable storage, mount a persistent volume and point these paths at it.
 */
function resolveWritableRoot(): string {
  const candidate = process.cwd();
  try {
    const testDir = path.join(candidate, '.__write_test__');
    fs.mkdirSync(testDir, { recursive: true });
    fs.rmdirSync(testDir);
    return candidate;
  } catch {
    const fallback = path.join(os.tmpdir(), 'lostcamp-app-data');
    fs.mkdirSync(fallback, { recursive: true });
    console.warn(
      `[paths] ${candidate} is not writable by the current user; falling back to ${fallback}. ` +
        `Data here will not persist across restarts — mount a persistent volume for durable storage.`
    );
    return fallback;
  }
}

export const APP_ROOT = resolveWritableRoot();
export const DATA_DIR = path.join(APP_ROOT, 'data');
export const UPLOADS_DIR = path.join(APP_ROOT, 'uploads');
export const LOGS_DIR = path.join(APP_ROOT, 'logs');
