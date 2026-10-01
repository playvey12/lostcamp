import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './dbHelper';
import { verifyToken, requireAdmin, AuthRequest, generateToken } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';
import { getCookieOptions } from '../utils/cookieOptions';
import { isAtLeastMinAge, MIN_AGE_ERROR_MESSAGE } from '../utils/ageCheck';
import { transporter, smtpUser, smtpPass } from '../utils/mailer';

const verifyCodeLimiter = createRateLimiter(5, 15 * 60 * 1000);

const router = Router();

if (!smtpUser || !smtpPass) {
  console.error('[SMTP WARNING]: SMTP не настроен, письма отправляться не будут');
}

// PUT /api/user/profile or /api/users/profile - update user profile (protected)
router.put('/profile', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { age, birthDate, address, name, firstName, lastName, deliveryInfo } = req.body;

    // Validation
    if (address !== undefined && (typeof address !== 'string' || address.trim() === '')) {
      return res.status(400).json({ error: 'Адрес не может быть пустым' });
    }

    if (age !== undefined && age !== null && age !== '' && isNaN(Number(age))) {
      return res.status(400).json({ error: 'Возраст должен быть числом' });
    }

    if (deliveryInfo !== undefined && deliveryInfo !== null && typeof deliveryInfo !== 'object') {
      return res.status(400).json({ error: 'Некорректные данные доставки' });
    }

    // Reject a birth date change that would put the user under the minimum age
    const nextBirthDate = birthDate || (age !== undefined ? String(age) : undefined);
    if (nextBirthDate !== undefined && !isAtLeastMinAge(nextBirthDate)) {
      return res.status(400).json({ error: MIN_AGE_ERROR_MESSAGE });
    }

    let parsedFirstName = firstName;
    let parsedLastName = lastName;
    if (name && typeof name === 'string' && !firstName) {
      const parts = name.trim().split(' ');
      parsedFirstName = parts[0] || '';
      parsedLastName = parts.slice(1).join(' ') || '';
    }

    const updatedUser = await db.updateUserProfile(req.user.email, {
      firstName: parsedFirstName,
      lastName: parsedLastName,
      birthDate: birthDate || (age !== undefined ? String(age) : undefined),
      age: age,
      address: address ? address.trim() : undefined,
      deliveryInfo: deliveryInfo !== undefined ? deliveryInfo : undefined,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      data: safeUser,
      user: safeUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Не удалось обновить профиль' });
  }
});

// POST /api/user/change-password or /api/users/change-password (protected)
router.post('/change-password', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { oldPassword, currentPassword, newPassword } = req.body;
    const oldPass = oldPassword || currentPassword;

    if (!oldPass || !newPassword) {
      return res.status(400).json({ error: 'Укажите старый и новый пароль' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать не менее 6 символов' });
    }

    const existingUser = await db.getUserByEmail(req.user.email);
    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (existingUser.passwordHash) {
      const isValid = db.verifyPassword(oldPass, existingUser.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Неверный старый пароль' });
      }
    }

    const newHash = db.hashPassword(newPassword);
    await db.updateUserPassword(req.user.email, newHash);
    const updatedUser = await db.getUserByEmail(req.user.email);

    const { passwordHash, ...safeUser } = updatedUser || {};

    return res.json({
      success: true,
      message: 'Пароль успешно изменен',
      user: safeUser,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Не удалось сменить пароль' });
  }
});

// POST /api/user/change-email/request or /api/users/change-email/request (protected)
router.post('/change-email/request', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { newEmail } = req.body;
    if (!newEmail || typeof newEmail !== 'string' || !newEmail.trim()) {
      return res.status(400).json({ error: 'Укажите новый email' });
    }

    const cleanNewEmail = newEmail.toLowerCase().trim();
    const cleanOldEmail = req.user.email.toLowerCase().trim();

    if (cleanNewEmail === cleanOldEmail) {
      return res.status(400).json({ error: 'Новый email совпадает с текущим' });
    }

    // Check if new email is already registered by another user
    const existingUser = await db.getUserByEmail(cleanNewEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Этот email уже зарегистрирован в системе' });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await db.saveVerificationCode(cleanNewEmail, code, 'change-email');

    if (!smtpUser || !smtpPass) {
      console.log(`[CHANGE EMAIL CODE DEV FALLBACK FOR ${cleanNewEmail}]: ${code}`);
      return res.json({
        success: true,
        message: 'Код подтверждения сгенерирован (SMTP не настроен, код в консоли)',
        fallbackCodeSent: true,
      });
    }

    const mailOptions = {
      from: `"LOST CAMP Tactical" <${smtpUser}>`,
      to: cleanNewEmail,
      subject: 'Код смены email в LOST CAMP',
      text: `Ваш код подтверждения смены email в LOST CAMP: ${code}`,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
          <h2 style="color: #34d399; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">LOST CAMP — Смена Email</h2>
          <p style="font-size: 14px; color: #d1d5db;">Вы запросили смену email в интернет-магазине LOST CAMP.</p>
          <div style="background-color: #1a2e20; border: 1px solid #059669; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">Если вы не запрашивали данный код, просто проигнорируйте это письмо.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Nodemailer send code error:', err);
        console.log(`[CHANGE EMAIL CODE FALLBACK FOR ${cleanNewEmail}]: ${code}`);
        return res.json({
          success: true,
          message: 'Код подтверждения отправлен на вашу новую почту!',
          fallbackCodeSent: true,
        });
      }
      console.log('Nodemailer sent code successfully:', info.response);
      return res.json({
        success: true,
        message: 'Код подтверждения отправлен на вашу новую почту!',
      });
    });
  } catch (error) {
    console.error('Error requesting email change:', error);
    return res.status(500).json({ error: 'Не удалось отправить код смены email' });
  }
});

// POST /api/user/change-email/confirm or /api/users/change-email/confirm (protected)
router.post('/change-email/confirm', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    const { newEmail, code } = req.body;
    if (!newEmail || !code) {
      return res.status(400).json({ error: 'Укажите новый email и код подтверждения' });
    }

    const cleanNewEmail = newEmail.toLowerCase().trim();
    const cleanOldEmail = req.user.email.toLowerCase().trim();

    const existingUser = await db.getUserByEmail(cleanNewEmail);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ error: 'Этот email уже зарегистрирован в системе' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${clientIp}:change-email:${cleanNewEmail}`;
    if (verifyCodeLimiter.isBlocked(key)) {
      return res.status(429).json({ success: false, error: 'Слишком много неудачных попыток. Попробуйте через 15 минут.' });
    }

    const verificationRecord = await db.getVerificationCode(cleanNewEmail, 'change-email');
    if (!verificationRecord) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Код не найден или истёк. Запросите новый код.' });
    }

    if (verificationRecord.expired) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Код истёк, запросите новый' });
    }

    if (verificationRecord.code.trim() !== code.toString().trim()) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Неверный код подтверждения!' });
    }

    verifyCodeLimiter.clearFailed(key);
    await db.deleteVerificationCode(cleanNewEmail, 'change-email');

    // Perform UPDATE on existing user record
    const updatedUser = await db.updateUserEmail(cleanOldEmail, cleanNewEmail);

    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const role = req.user.role || 'user';
    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    });

    res.cookie('token', token, getCookieOptions());

    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      message: 'Email успешно изменён',
      token,
      user: {
        ...safeUser,
        role,
      },
    });
  } catch (error) {
    console.error('Error confirming email change:', error);
    return res.status(500).json({ error: 'Не удалось сменить email' });
  }
});

// POST send-code (Nodemailer email verification)
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email mandatory' });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await db.saveVerificationCode(email, code);

    if (!smtpUser || !smtpPass) {
      console.log(`[VERIFICATION CODE DEV FALLBACK FOR ${email}]: ${code}`);
      return res.json({
        success: true,
        message: 'Код подтверждения сгенерирован (SMTP не настроен, код в консоли)',
        fallbackCodeSent: true,
      });
    }

    const mailOptions = {
      from: `"LOST CAMP Tactical" <${smtpUser}>`,
      to: email,
      subject: 'Код подтверждения регистрации LOST CAMP',
      text: `Ваш код подтверждения для входа/регистрации в LOST CAMP: ${code}`,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
          <h2 style="color: #34d399; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">LOST CAMP — Подтверждение Почты</h2>
          <p style="font-size: 14px; color: #d1d5db;">Вы запросили код подтверждения для авторизации в интернет-магазине тактического снаряжения LOST CAMP.</p>
          <div style="background-color: #1a2e20; border: 1px solid #059669; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #9ca3af;">Если вы не запрашивали данный код, просто проигнорируйте это письмо.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Nodemailer send code error:', err);
        // Even if SMTP temporarily fails, log code to server console for easy testing
        console.log(`[VERIFICATION CODE FALLBACK FOR ${email}]: ${code}`);
        return res.json({
          success: true,
          message: 'Код подтверждения отправлен на вашу почту!',
          fallbackCodeSent: true,
        });
      }
      console.log('Nodemailer sent code successfully:', info.response);
      return res.json({
        success: true,
        message: 'Код подтверждения отправлен на вашу почту!',
      });
    });
  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({ error: 'Failed to send confirmation code' });
  }
});

// POST verify-code
router.post('/verify-code', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const key = `${clientIp}:${email.toLowerCase().trim()}`;
    if (verifyCodeLimiter.isBlocked(key)) {
      return res.status(429).json({ success: false, error: 'Слишком много неудачных попыток. Попробуйте через 15 минут.' });
    }

    const verificationRecord = await db.getVerificationCode(email);
    if (!verificationRecord) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Код не найден или истек. Запросите новый код.' });
    }

    if (verificationRecord.expired) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Код истёк, запросите новый' });
    }

    if (verificationRecord.code.trim() !== code.toString().trim()) {
      verifyCodeLimiter.recordFailed(key);
      return res.status(400).json({ success: false, error: 'Неверный код подтверждения!' });
    }

    // Code is valid - clear failures and remove used code
    verifyCodeLimiter.clearFailed(key);
    await db.deleteVerificationCode(email);
    await db.setUserVerified(email);

    // Get or create user and issue JWT token
    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.upsertUser({
        email: email.toLowerCase().trim(),
        firstName: email.split('@')[0],
        authProvider: 'email',
      });
    }

    const role = 'user';
    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.cookie('token', token, getCookieOptions());

    res.json({
      success: true,
      message: 'Почта успешно подтверждена',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
      },
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// GET all registered users from SQLite database (admin protected)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map(({ passwordHash, ...safeUser }: any) => safeUser);
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;


