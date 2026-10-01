import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimiter';
import { notifyAdmin, escapeHtml } from '../utils/mailer';

const router = Router();

const contactLimiter = createRateLimiter(3, 15 * 60 * 1000, 'Слишком много обращений. Попробуйте позже.');

router.post('/', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (contactLimiter.isBlocked(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Слишком много обращений. Попробуйте позже.',
    });
  }

  const { contact, message } = req.body;

  contactLimiter.recordFailed(clientIp);

  const safeContact = escapeHtml(contact) || 'Не указаны';
  const safeMessage = escapeHtml(message) || 'Без текста';

  // Send admin notification email fire-and-forget
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #34d399; margin-top: 0; border-bottom: 1px solid #2e4733; padding-bottom: 12px;">LOST CAMP — Новое обращение из контактов</h2>
      <p style="margin-bottom: 8px;"><strong style="color: #a7f3d0;">Контактные данные:</strong> ${safeContact}</p>
      <p style="margin-bottom: 16px;"><strong style="color: #a7f3d0;">Сообщение:</strong></p>
      <div style="background-color: #1a2e20; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${safeMessage}</div>
      <p style="margin-top: 24px; font-size: 12px; color: #888888;">Письмо сгенерировано автоматически формой обратной связи LOST CAMP.</p>
    </div>
  `;

  notifyAdmin('Новая заявка с сайта — Контакты', html).catch((err) => {
    console.error('Error sending contact notification email:', err);
  });

  res.json({
    success: true,
    message: 'Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.',
  });
});

export default router;
