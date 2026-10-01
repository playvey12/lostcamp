import { Router } from 'express';
import authRouter from './auth';
import categoriesRouter from './categories';
import productsRouter from './products';
import ordersRouter from './orders';
import siteRouter from './site';
import contactRouter from './contact';
import usersRouter from './users';
import newsRouter from './news';
import reviewsRouter from './reviews';
import newsletterRouter from './newsletter';
import deliveryRouter from './delivery';
import paymentsRouter from './payments';
import backupRouter from './backup';

const router = Router();

router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);
router.use('/site', siteRouter);
router.use('/contact', contactRouter);
router.use('/users', usersRouter);
router.use('/user', usersRouter);
router.use('/news', newsRouter);
router.use('/reviews', reviewsRouter);
router.use('/newsletter', newsletterRouter);
router.use('/delivery', deliveryRouter);
router.use('/payments', paymentsRouter);
router.use('/backup', backupRouter);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'LOST CAMP Tactical Gear' });
});

export default router;
