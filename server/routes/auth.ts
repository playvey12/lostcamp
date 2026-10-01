import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './dbHelper';
import { generateToken, verifyToken, AuthRequest, requireAdmin } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

import { transporter, isMailConfigured, getMailFromEmail } from '../utils/mailer';

import { createRateLimiter } from '../middleware/rateLimiter';
import { getCookieOptions } from '../utils/cookieOptions';
import { isAtLeastMinAge, MIN_AGE_ERROR_MESSAGE } from '../utils/ageCheck';

// Re-export requireAdmin & verifyToken for other routes
export { requireAdmin, verifyToken };

// Rate limiter for login attempts (IP-based)
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);

// Rate limiter for registration attempts (IP-based, 3 attempts per 15 minutes)
const registerLimiter = createRateLimiter(3, 15 * 60 * 1000, 'Слишком много попыток регистрации. Попробуйте через 15 минут.');

// Rate limiter for forgot password requests (IP-based, 3 attempts per 15 minutes)
const forgotPasswordLimiter = createRateLimiter(3, 15 * 60 * 1000, 'Слишком много запросов на сброс пароля. Попробуйте через 15 минут.');

// Rate limiter for password reset verification code attempts (IP + Email key)
const resetCodeLimiter = createRateLimiter(5, 15 * 60 * 1000);

const COOKIE_OPTIONS = getCookieOptions();

// POST /api/auth/register - Register new user
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    registerLimiter.check(clientIp);
    registerLimiter.recordFailed(clientIp);

    const { email, password, firstName, lastName, birthDate, address } = req.body;

    if (!email || !password) {
      throw new AppError('Email и пароль обязательны', 400);
    }

    if (password.length < 6) {
      throw new AppError('Пароль должен содержать минимум 6 символов', 400);
    }

    if (!birthDate || !isAtLeastMinAge(birthDate)) {
      throw new AppError(MIN_AGE_ERROR_MESSAGE, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await db.getUserByEmail(cleanEmail);
    if (existingUser && existingUser.passwordHash && existingUser.isVerified) {
      throw new AppError('Пользователь с таким email уже зарегистрирован', 400);
    }

    // Generate 6-digit OTP code
    const code = crypto.randomInt(100000, 1000000).toString();

    // If mail (Resend) is configured, send the OTP. If sending fails, fall back to logging the code.
    let emailDeliveryFailed = false;
    if (!isMailConfigured()) {
      console.log(`[REGISTER OTP DEV FALLBACK FOR ${cleanEmail}]: ${code}`);
      emailDeliveryFailed = true;
    } else {
      const mailOptions = {
        from: `"LOST CAMP Tactical" <${getMailFromEmail()}>`,
        to: cleanEmail,
        subject: 'Код подтверждения регистрации LOST CAMP',
        text: `Ваш код для подтверждения регистрации в LOST CAMP: ${code}`,
        html: `
          <div style="font-family: monospace, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
            <h2 style="color: #34d399; margin-top: 0;">LOST CAMP — Подтверждение Регистрации</h2>
            <p style="font-size: 14px; color: #d1d5db;">Спасибо за регистрацию. Введите следующий 6-значный код для активации аккаунта:</p>
            <div style="background-color: #1a2e20; border: 1px solid #059669; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af;">Если вы не регистрировались в LOST CAMP, проигнорируйте это письмо.</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (mailErr: any) {
        console.error('Resend register send error:', mailErr);
        console.log(`[REGISTER OTP FALLBACK FOR ${cleanEmail}]: ${code}`);
        emailDeliveryFailed = true;
      }
    }

    const passwordHash = db.hashPassword(password);
    await db.upsertUser({
      email: cleanEmail,
      firstName: firstName || '',
      lastName: lastName || '',
      birthDate: birthDate || '',
      address: address || '',
      authProvider: 'email',
      passwordHash,
      isVerified: 0,
    });

    await db.saveVerificationCode(cleanEmail, code, 'register');

    res.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      emailDeliveryFailed,
      message: 'Код подтверждения отправлен на ваш email',
    });
  })
);

// POST /api/auth/verify-code - Verify OTP code after registration
router.post(
  '/verify-code',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new AppError('Email и код подтверждения обязательны', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const verificationRecord = await db.getVerificationCode(cleanEmail, 'register');

    if (!verificationRecord) {
      throw new AppError('Код подтверждения не найден или истек', 400);
    }

    if (verificationRecord.expired) {
      throw new AppError('Код подтверждения истёк, запросите новый', 400);
    }

    if (verificationRecord.code.trim() !== code.toString().trim()) {
      throw new AppError('Неверный код подтверждения', 400);
    }

    await db.setUserVerified(cleanEmail);
    await db.deleteVerificationCode(cleanEmail, 'register');

    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    const role = 'user';
    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
      },
    });
  })
);

// POST /api/auth/login - User / General Login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    loginLimiter.check(clientIp);

    const { email, password } = req.body;

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      loginLimiter.recordFailed(clientIp);
      throw new AppError('Укажите email и пароль', 400);
    }

    const user = await db.getUserByEmail(cleanEmail);
    
    let isValidPassword = false;
    if (user && user.passwordHash) {
      isValidPassword = db.verifyPassword(password, user.passwordHash);
    }

    if (!user || !isValidPassword) {
      loginLimiter.recordFailed(clientIp);
      throw new AppError('Неверный email или пароль', 401);
    }

    if (user.authProvider === 'email' && user.isVerified === 0) {
      loginLimiter.recordFailed(clientIp);
      throw new AppError('Email не подтвержден. Пожалуйста, подтвердите email.', 400);
    }

    loginLimiter.clearFailed(clientIp);

    const role = 'user';
    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
      },
    });
  })
);

// POST /api/auth/admin-login - Admin Panel Login
router.post(
  '/admin-login',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    loginLimiter.check(clientIp);

    const { password } = req.body;
    const expectedPassword = process.env.ADMIN_PASSWORD || '12344321';

    if (!password || password !== expectedPassword) {
      loginLimiter.recordFailed(clientIp);
      throw new AppError('Неверный пароль администратора', 401);
    }

    loginLimiter.clearFailed(clientIp);

    const token = generateToken({
      id: 'admin',
      email: 'admin@lostcamp.ru',
      role: 'admin',
      firstName: 'Администратор',
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      token,
      user: {
        id: 'admin',
        email: 'admin@lostcamp.ru',
        role: 'admin',
        firstName: 'Администратор',
      },
    });
  })
);

// POST /api/auth/logout - Logout endpoint
router.post('/logout', (_req: Request, res: Response) => {
  const cookieOpts = getCookieOptions();
  res.clearCookie('token', { path: cookieOpts.path, sameSite: cookieOpts.sameSite, secure: cookieOpts.secure });
  res.json({ success: true, message: 'Выход выполнен' });
});

// GET /api/auth/me - Current User Profile from JWT token
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Не авторизован', 401);
    }

    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: 'admin',
          firstName: req.user.firstName || 'Администратор',
        },
      });
    }

    const user = await db.getUserByEmail(req.user.email);
    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        address: user.address,
        role: req.user.role,
      },
    });
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    forgotPasswordLimiter.check(clientIp);
    forgotPasswordLimiter.recordFailed(clientIp);

    const { email } = req.body;
    if (!email) {
      throw new AppError('Укажите email адрес', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);

    if (!user) {
      throw new AppError('Пользователь с таким email не найден', 404);
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await db.saveVerificationCode(cleanEmail, code, 'reset');

    let emailDeliveryFailed = false;
    if (!isMailConfigured()) {
      console.log(`[FORGOT PASSWORD CODE DEV FALLBACK FOR ${cleanEmail}]: ${code}`);
      emailDeliveryFailed = true;
    } else {
      const mailOptions = {
        from: `"LOST CAMP Tactical" <${getMailFromEmail()}>`,
        to: cleanEmail,
        subject: 'Сброс пароля в LOST CAMP',
        text: `Код для сброса пароля в LOST CAMP: ${code}`,
        html: `
          <div style="font-family: monospace, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
            <h2 style="color: #34d399; margin-top: 0;">LOST CAMP — Сброс Пароля</h2>
            <p style="font-size: 14px; color: #d1d5db;">Вы запросили сброс пароля для вашей учетной записи.</p>
            <div style="background-color: #1a2e20; border: 1px solid #059669; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error('Resend forgot-password send error:', err);
          console.log(`[FORGOT PASSWORD CODE FALLBACK FOR ${cleanEmail}]: ${code}`);
        }
      });
    }

    res.json({
      success: true,
      emailDeliveryFailed,
      message: 'Код подтверждения для сброса пароля отправлен на ваш email',
    });
  })
);

// POST /api/auth/verify-reset-code
router.post(
  '/verify-reset-code',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { email, code } = req.body;
    if (!email || !code) {
      throw new AppError('Email и код сброса обязательны', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const key = `${clientIp}:${cleanEmail}`;
    resetCodeLimiter.check(key);

    const verificationRecord = await db.getVerificationCode(cleanEmail, 'reset');
    if (!verificationRecord) {
      resetCodeLimiter.recordFailed(key);
      throw new AppError('Код сброса не найден или истек. Запросите новый код.', 400);
    }

    if (verificationRecord.expired) {
      resetCodeLimiter.recordFailed(key);
      throw new AppError('Код сброса истёк, запросите новый', 400);
    }

    if (verificationRecord.code.trim() !== code.toString().trim()) {
      resetCodeLimiter.recordFailed(key);
      throw new AppError('Неверный код сброса пароля', 400);
    }

    resetCodeLimiter.clearFailed(key);

    res.json({
      success: true,
      message: 'Код подтвержден',
    });
  })
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      throw new AppError('Все поля (email, код и новый пароль) обязательны', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Новый пароль должен содержать минимум 6 символов', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const verificationRecord = await db.getVerificationCode(cleanEmail, 'reset');
    if (!verificationRecord || verificationRecord.expired || verificationRecord.code.trim() !== code.toString().trim()) {
      throw new AppError('Неверный или просроченный код сброса', 400);
    }

    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    const newHash = db.hashPassword(newPassword);
    await db.updateUserPassword(cleanEmail, newHash);
    await db.deleteVerificationCode(cleanEmail, 'reset');

    res.json({
      success: true,
      message: 'Пароль успешно изменен',
    });
  })
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.email) {
      throw new AppError('Не авторизован', 401);
    }

    const { oldPassword, currentPassword, newPassword } = req.body;
    const oldPass = oldPassword || currentPassword;

    if (!oldPass || !newPassword) {
      throw new AppError('Укажите старый и новый пароль', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Новый пароль должен быть не менее 6 символов', 400);
    }

    const user = await db.getUserByEmail(req.user.email);
    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    if (user.passwordHash) {
      const isValid = db.verifyPassword(oldPass, user.passwordHash);
      if (!isValid) {
        throw new AppError('Старый пароль указан неверно', 400);
      }
    }

    const newHash = db.hashPassword(newPassword);
    await db.updateUserPassword(req.user.email, newHash);

    res.json({
      success: true,
      message: 'Пароль успешно изменен',
    });
  })
);

export default router;
