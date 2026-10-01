import { AppError } from './errorHandler';

export interface RateLimiter {
  check: (key: string) => void;
  isBlocked: (key: string) => boolean;
  recordFailed: (key: string) => void;
  clearFailed: (key: string) => void;
}

export function createRateLimiter(
  maxAttempts: number = 5,
  blockDurationMs: number = 15 * 60 * 1000,
  errorMessage: string = 'Слишком много неудачных попыток. Попробуйте через 15 минут.'
): RateLimiter {
  const attempts = new Map<string, { count: number; blockedUntil: number }>();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, attempt] of attempts.entries()) {
      if (attempt.blockedUntil <= now) {
        attempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  cleanupInterval.unref();

  return {
    check(key: string) {
      const now = Date.now();
      const attempt = attempts.get(key);
      if (attempt && attempt.blockedUntil > now) {
        throw new AppError(errorMessage, 429);
      }
    },

    isBlocked(key: string): boolean {
      const now = Date.now();
      const attempt = attempts.get(key);
      return !!(attempt && attempt.blockedUntil > now);
    },

    recordFailed(key: string) {
      const now = Date.now();
      const attempt = attempts.get(key) || { count: 0, blockedUntil: 0 };
      const count = attempt.count + 1;
      const blockedUntil = count >= maxAttempts ? now + blockDurationMs : 0;
      attempts.set(key, { count, blockedUntil });
    },

    clearFailed(key: string) {
      attempts.delete(key);
    },
  };
}
