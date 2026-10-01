import { db } from '../routes/dbHelper';
import { transporter, smtpUser, smtpPass } from '../utils/mailer';

// Stage intervals in milliseconds:
// Stage 1: 3 hours (3 * 60 * 60 * 1000)
// Stage 2: 24 hours (24 * 60 * 60 * 1000)
// Stage 3: 7 days (7 * 24 * 60 * 60 * 1000)
// Stage 4: 30 days (30 * 24 * 60 * 60 * 1000)
const STAGE_DELAYS_MS = [
  3 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
];

const STAGE_TITLES = [
  'Вы забыли товары в вашей корзине LOST CAMP',
  'Ваша корзина все еще вас ждет в LOST CAMP',
  'Не упустите товары в вашей корзине LOST CAMP',
  'Спешите оформить заказ в LOST CAMP',
];

export async function processCartReminders(): Promise<void> {
  try {
    const pendingReminders = await db.getPendingCartReminders();
    const now = Date.now();

    for (const reminder of pendingReminders) {
      if (!reminder.cartSnapshot || reminder.cartSnapshot.length === 0) {
        continue;
      }

      const isSubscribed = await db.isEmailSubscribed(reminder.userEmail);
      if (!isSubscribed) {
        continue;
      }

      const nextStage = reminder.lastReminderStage + 1;
      if (nextStage > STAGE_DELAYS_MS.length) {
        // Exceeded max stage
        await db.markCartReminderCompleted(reminder.userEmail);
        continue;
      }

      const requiredDelay = STAGE_DELAYS_MS[nextStage - 1];
      const baseTime = reminder.lastSentAt ? new Date(reminder.lastSentAt).getTime() : new Date(reminder.createdAt).getTime();

      if (now - baseTime >= requiredDelay) {
        // Time to send reminder for nextStage
        await sendReminderEmail(reminder.userEmail, reminder.cartSnapshot, nextStage);
        await db.updateCartReminderStage(reminder.userEmail, nextStage);
      }
    }
  } catch (err) {
    console.error('[CART REMINDER WORKER ERROR]:', err);
  }
}

async function sendReminderEmail(userEmail: string, cartItems: any[], stage: number): Promise<void> {
  const title = STAGE_TITLES[stage - 1] || 'Напоминание о корзине LOST CAMP';

  const itemsHtml = cartItems
    .map((item: any) => {
      const p = item.product || item;
      const titleText = p.title || 'Товар';
      const priceText = p.price ? `${p.price} RUB` : '';
      const qty = item.quantity || 1;
      const color = item.selectedColor ? ` (${item.selectedColor})` : '';
      return `<li style="margin-bottom: 8px; font-size: 14px; color: #d1d5db;"><strong>${titleText}</strong>${color} — ${qty} шт. ${priceText}</li>`;
    })
    .join('');

  const unsubscribeUrl = `/api/newsletter/unsubscribe?email=${encodeURIComponent(userEmail)}`;

  if (smtpUser && smtpPass) {
    const mailOptions = {
      from: `"LOST CAMP Tactical" <${smtpUser}>`,
      to: userEmail,
      subject: title,
      html: `
        <div style="font-family: monospace, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733;">
          <h2 style="color: #34d399; margin-top: 0;">LOST CAMP — Забытая Корзина</h2>
          <p style="font-size: 14px; color: #d1d5db;">Здравствуйте! Вы добавили снаряжение в корзину, но не завершили оформление заказа:</p>
          <ul style="background-color: #1a2e20; border: 1px solid #059669; border-radius: 8px; padding: 16px 24px; margin: 20px 0;">
            ${itemsHtml}
          </ul>
          <p style="font-size: 14px; color: #d1d5db;">Вернитесь в магазин, чтобы завершить покупку.</p>
          <hr style="border-color: #2e4733; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af;">Если вы не хотите получать такие уведомления, нажмите <a href="${unsubscribeUrl}" style="color: #34d399;">отписаться</a>.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) console.error(`[CART REMINDER] Failed to send stage ${stage} reminder to ${userEmail}:`, err);
      else console.log(`[CART REMINDER] Stage ${stage} reminder sent to ${userEmail}`);
    });
  } else {
    console.log(`[CART REMINDER DEV FALLBACK]: Stage ${stage} reminder triggered for ${userEmail} with ${cartItems.length} items`);
  }
}

export function startCartReminderWorker(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log('[CART REMINDER WORKER] Worker started with interval:', intervalMs, 'ms');
  // Initial check after 10s
  setTimeout(processCartReminders, 10000);
  return setInterval(processCartReminders, intervalMs);
}
