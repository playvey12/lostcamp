import { Router, Request, Response } from 'express';
import { db } from './dbHelper';
import { verifyToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { notifyAdmin, escapeHtml } from '../utils/mailer';

const router = Router();

// GET all orders (protected)
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const orders = await db.getOrders();
    res.json({ success: true, data: orders });
  })
);

// GET my orders (user protected)
router.get(
  '/my',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userEmail = req.user?.email?.toLowerCase();
    if (!userEmail) {
      return res.json({ success: true, data: [] });
    }
    const allOrders: any[] = await db.getOrders();
    const userOrders = allOrders.filter(
      (o: any) => o.email && String(o.email).toLowerCase() === userEmail
    );
    res.json({ success: true, data: userOrders });
  })
);

// POST create order (public checkout) or bulk save orders (admin)
router.post(
  '/',
  (req, res, next) => {
    if (Array.isArray(req.body)) {
      return requireAdmin(req, res, next);
    }
    next();
  },
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    if (Array.isArray(body)) {
      await db.saveOrders(body);
      return res.json({ success: true, data: body });
    }

    if (!body || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError('Корзина пуста', 400);
    }

    const dbProducts: any[] = await db.getProducts();

    let itemsTotal = 0;
    const calculatedItems = [];

    for (const item of body.items) {
      const rawId = item.productId ?? item.id ?? item.product?.id;
      const targetIdStr = rawId !== undefined && rawId !== null ? String(rawId) : '';

      let dbProduct = dbProducts.find((p: any) => String(p.id) === targetIdStr);

      if (!dbProduct && item.title) {
        const itemTitleLower = String(item.title).trim().toLowerCase();
        dbProduct = dbProducts.find(
          (p: any) => p.title && String(p.title).trim().toLowerCase() === itemTitleLower
        );
      }

      if (dbProduct && (dbProduct.inStock === false || dbProduct.inStock === 0 || dbProduct.inStock === '0')) {
        throw new AppError('Товар недоступен', 400);
      }

      const price =
        dbProduct && Number.isFinite(Number(dbProduct.price))
          ? Number(dbProduct.price)
          : Number(item.price) || 0;

      const quantity = Math.max(1, Number(item.quantity) || 1);

      itemsTotal += price * quantity;

      calculatedItems.push({
        ...item,
        id: dbProduct ? dbProduct.id : item.id || rawId || 'unknown',
        title: dbProduct?.title || item.title || 'Товар',
        price,
        quantity,
      });
    }

    // deliveryCost can be passed in body; fixed tariffs are not defined as a separate DB entity in this app
    const rawDeliveryCost = Number(body.deliveryCost);
    const deliveryCost =
      Number.isFinite(rawDeliveryCost) && rawDeliveryCost >= 0 ? rawDeliveryCost : 0;

    const calculatedTotal = itemsTotal + deliveryCost;

    const newOrder = await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const created = {
        ...body,
        id: body.id || `LC-${Math.floor(10000 + Math.random() * 90000)}`,
        date:
          body.date ||
          new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        status: body.status || 'В обработке',
        items: calculatedItems,
        total: calculatedTotal,
        deliveryCost: deliveryCost,
      };

      orders.unshift(created);
      await db.saveOrders(orders);
      return created;
    });

    if (body.email) {
      await db.markCartReminderCompleted(body.email);
    }

    // Send admin notification email fire-and-forget
    const rawCustomerName = body.name || body.fullName || [body.firstName, body.lastName].filter(Boolean).join(' ') || body.customerName;
    const customerDetails = [
      rawCustomerName && escapeHtml(rawCustomerName),
      body.phone && `Тел: ${escapeHtml(body.phone)}`,
      body.email && `Email: ${escapeHtml(body.email)}`,
      body.address && `Адрес: ${escapeHtml(body.address)}`,
      body.comment && `Комментарий: ${escapeHtml(body.comment)}`,
    ].filter(Boolean).join('<br/>');

    const itemsRows = calculatedItems.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #2e4733;">${escapeHtml(item.title || 'Товар')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #2e4733; text-align: center;">${item.quantity} шт.</td>
        <td style="padding: 8px; border-bottom: 1px solid #2e4733; text-align: right;">${item.price} ₽</td>
        <td style="padding: 8px; border-bottom: 1px solid #2e4733; text-align: right;">${item.price * item.quantity} ₽</td>
      </tr>
    `).join('');

    const orderHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #2e4733; max-width: 650px; margin: 0 auto;">
        <h2 style="color: #34d399; margin-top: 0; border-bottom: 1px solid #2e4733; padding-bottom: 12px;">LOST CAMP — Новый заказ №${newOrder.id}</h2>
        <div style="margin-bottom: 20px; background-color: #1a2e20; padding: 16px; border-radius: 8px;">
          <h3 style="color: #a7f3d0; margin-top: 0; margin-bottom: 8px; font-size: 16px;">Данные покупателя:</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">${customerDetails || 'Контакты не указаны'}</p>
        </div>
        <h3 style="color: #a7f3d0; margin-bottom: 12px; font-size: 16px;">Состав заказа:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1a2e20; color: #34d399;">
              <th style="padding: 8px; text-align: left;">Товар</th>
              <th style="padding: 8px; text-align: center;">Кол-во</th>
              <th style="padding: 8px; text-align: right;">Цена</th>
              <th style="padding: 8px; text-align: right;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div style="text-align: right; font-size: 16px; border-top: 1px solid #2e4733; padding-top: 12px;">
          ${deliveryCost > 0 ? `<p style="margin: 4px 0; color: #a7f3d0;">Доставка: ${deliveryCost} ₽</p>` : ''}
          <p style="margin: 4px 0; font-weight: bold; color: #34d399; font-size: 18px;">Итого: ${calculatedTotal} ₽</p>
        </div>
      </div>
    `;

    notifyAdmin(`Новый заказ №${newOrder.id}`, orderHtml).catch((err) => {
      console.error('Error sending order notification email:', err);
    });

    res.json({ success: true, data: newOrder });
  })
);

// PUT update all orders or single order by ID (admin protected)
router.put(
  '/',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const orders = req.body;
    await db.saveOrders(orders);
    res.json({ success: true, data: orders });
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const index = orders.findIndex((o: any) => o.id === id);
      if (index >= 0) {
        orders[index] = { ...orders[index], ...req.body };
        await db.saveOrders(orders);
        return orders[index];
      } else {
        throw new AppError('Заказ не найден', 404);
      }
    });
    res.json({ success: true, data: updated });
  })
);

// DELETE order by ID (admin protected)
router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const filtered = orders.filter((o: any) => o.id !== id);
      await db.saveOrders(filtered);
    });
    res.json({ success: true, message: 'Заказ успешно удален', id });
  })
);

export default router;
