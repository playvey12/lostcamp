import { Router, Request, Response } from 'express';
import { db } from './dbHelper';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { createYookassaPayment, getYookassaPayment, isYookassaConfigured } from '../utils/yookassa';

const router = Router();

// POST /api/payments/create — starts a YooKassa payment for an existing
// order and returns the hosted page the customer should be redirected to.
router.post(
  '/create',
  asyncHandler(async (req: Request, res: Response) => {
    if (!isYookassaConfigured()) {
      throw new AppError('Оплата через ЮKassa временно недоступна: не настроен магазин.', 503);
    }

    const { orderId } = req.body;
    if (!orderId) {
      throw new AppError('Не указан номер заказа', 400);
    }

    const updatedOrder = await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) {
        throw new AppError('Заказ не найден', 404);
      }
      if (order.paid) {
        throw new AppError('Заказ уже оплачен', 400);
      }

      return order;
    });

    const payment = await createYookassaPayment({
      orderId: updatedOrder.id,
      amount: Number(updatedOrder.total) || 0,
      description: `Заказ №${updatedOrder.id} — LOST CAMP`,
      customerEmail: updatedOrder.email || undefined,
    });

    // Remember the payment id on the order so the webhook can find it again.
    await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const index = orders.findIndex((o: any) => o.id === orderId);
      if (index >= 0) {
        orders[index] = { ...orders[index], paymentId: payment.id, paymentMethod: 'ЮKassa' };
        await db.saveOrders(orders);
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        confirmationUrl: payment.confirmation?.confirmation_url || null,
      },
    });
  })
);

// POST /api/payments/webhook — YooKassa server notification endpoint.
// Configure this URL (https://<your-domain>/api/payments/webhook) in the
// YooKassa merchant dashboard under Settings -> HTTP notifications.
//
// YooKassa webhook bodies are NOT signed, so per YooKassa's own guidance we
// never trust the notification body for the payment status — we take only
// the payment id from it and re-fetch the payment from the API to confirm
// what actually happened before updating anything.
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const paymentId = req.body?.object?.id;
    if (!paymentId) {
      // Malformed/irrelevant notification — acknowledge so YooKassa stops retrying.
      return res.status(200).json({ success: true });
    }

    const payment = await getYookassaPayment(paymentId);
    const orderId = payment.metadata?.orderId;

    await db.withOrdersLock(async () => {
      const orders: any[] = await db.getOrders();
      const index = orderId
        ? orders.findIndex((o: any) => o.id === orderId)
        : orders.findIndex((o: any) => o.paymentId === paymentId);

      if (index < 0) return;

      if (payment.status === 'succeeded' && payment.paid) {
        orders[index] = { ...orders[index], paid: true, status: 'Оплачен', paymentId };
      } else if (payment.status === 'canceled') {
        orders[index] = { ...orders[index], paid: false, status: 'Оплата отменена', paymentId };
      }

      await db.saveOrders(orders);
    });

    // Always 200 — YooKassa retries on anything else, which would just
    // repeat this same handling.
    res.status(200).json({ success: true });
  })
);

// GET /api/payments/status/:orderId — lets the frontend poll whether an
// order has been paid yet (e.g. on the order-success page).
router.get(
  '/status/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const orders: any[] = await db.getOrders();
    const order = orders.find((o: any) => o.id === req.params.orderId);
    if (!order) {
      throw new AppError('Заказ не найден', 404);
    }
    res.json({ success: true, data: { paid: Boolean(order.paid), status: order.status } });
  })
);

export default router;
