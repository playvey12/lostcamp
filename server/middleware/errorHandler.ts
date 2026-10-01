import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { LOGS_DIR } from '../utils/paths';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = ['password', 'token', 'passwordhash', 'secret', 'adminpassword', 'smtppass'];
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function logErrorToFile(err: any, req: Request, statusCode: number) {
  try {
    const logsDir = LOGS_DIR;
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'error.log');

    const logEntry = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: err.message || String(err),
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body ? sanitizeData(req.body) : undefined,
      stack: err.stack || null,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFilePath, logLine, 'utf-8');
  } catch (loggingErr) {
    console.error('[LOGGER ERROR]: Failed writing to error.log:', loggingErr);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Внутренняя ошибка сервера';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Размер файла не должен превышать 5 МБ.';
    } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Превышено максимальное количество файлов (не более 5 фото на отзыв).';
    } else {
      message = `Ошибка при загрузке файлов: ${err.message}`;
    }
  }

  if (statusCode >= 500) {
    console.error('[SERVER ERROR]:', err);
    logErrorToFile(err, req, statusCode);
  } else {
    console.warn(`[HTTP ${statusCode}]:`, message);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
  });
};
