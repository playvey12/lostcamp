import { Router, Request, Response } from 'express';
import { db } from './dbHelper';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { transporter, smtpUser, smtpPass } from '../utils/mailer';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiter for newsletter subscription attempts (IP-based, 5 attempts per 15 minutes)
const subscribeLimiter = createRateLimiter(5, 15 * 60 * 1000, 'Слишком много запросов на подписку. Попробуйте через 15 минут.');

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post(
  '/subscribe',
  asyncHandler(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    subscribeLimiter.check(clientIp);
    subscribeLimiter.recordFailed(clientIp);

    const { email, source } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError('Укажите корректный адрес электронной почты', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    await db.saveSubscriber(cleanEmail, source || 'faq');

    // Send welcome email if SMTP configured
    if (smtpUser && smtpPass) {
      const mailOptions = {
        from: `"LOST CAMP Tactical" <${smtpUser}>`,
        to: cleanEmail,
        subject: 'Добро пожаловать в LOST CAMP!',
        html: `
          <div style="font-family: sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
            <h2 style="color: #34d399; margin-top: 0;">LOST CAMP — Рассылка оформлена</h2>
            <p style="font-size: 14px; color: #d1d5db;">Вы успешно подписались на рассылку эксклюзивных новостей и специальных предложений снаряжения LOST CAMP.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Если вы хотите отписаться, перейдите по <a href="${req.protocol}://${req.get('host')}/api/newsletter/unsubscribe?email=${encodeURIComponent(cleanEmail)}" style="color: #34d399;">ссылке для отписки</a>.</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) console.error('[NEWSLETTER] Error sending welcome email:', err);
      });
    } else {
      console.log(`[NEWSLETTER DEV FALLBACK]: Subscribed email ${cleanEmail}`);
    }

    res.json({
      success: true,
      message: 'Вы успешно подписались на рассылку!',
    });
  })
);

// GET /api/newsletter/unsubscribe - Unsubscribe from newsletter & reminders
router.get(
  '/unsubscribe',
  asyncHandler(async (req: Request, res: Response) => {
    const email = req.query.email as string;
    if (!email) {
      throw new AppError('Email не указан', 400);
    }

    await db.unsubscribeEmail(email);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LOST CAMP - Отписка</title>
          <style>
            body { background: #121212; color: #ffffff; font-family: monospace, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1a2e20; border: 1px solid #059669; padding: 32px; border-radius: 12px; text-align: center; max-width: 480px; }
            h1 { color: #34d399; margin-top: 0; }
            p { color: #d1d5db; font-size: 14px; }
            a { color: #34d399; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>LOST CAMP</h1>
            <p>Вы успешно отписались от рассылки и уведомлений о корзине.</p>
            <p><a href="/">Вернуться в магазин</a></p>
          </div>
        </body>
      </html>
    `);
  })
);

// POST /api/newsletter/cart-sync - Sync active user cart for abandoned cart worker
router.post(
  '/cart-sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, cart } = req.body;
    if (!email || typeof email !== 'string') {
      return res.json({ success: true });
    }

    await db.saveCartReminder(email, Array.isArray(cart) ? cart : []);

    res.json({ success: true });
  })
);

export default router;
