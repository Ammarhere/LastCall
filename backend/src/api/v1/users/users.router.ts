import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { uploadAvatar } from '../../../middleware/upload';
import { prisma } from '../../../config/db';
import { NotFoundError } from '../../../errors/AppError';

const router = Router();

const updateSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// GET /api/v1/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, phone: true, name: true, email: true, role: true, avatarUrl: true, referralCode: true, createdAt: true },
    });
    if (!user) throw new NotFoundError('User');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/me
router.patch('/me', authenticate, validate(updateSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data:  req.body,
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/me/avatar
router.patch('/me/avatar', authenticate, uploadAvatar, async (req, res, next) => {
  try {
    const file = req.file as any;
    const avatarUrl = file?.location ?? file?.path ?? null;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// GET /api/v1/users/me/orders
router.get('/me/orders', authenticate, requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: { bag: { include: { partner: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// GET /api/v1/users/me/favourites
router.get('/me/favourites', authenticate, requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const favs = await prisma.favourite.findMany({
      where: { userId: req.user!.userId },
      include: { partner: true },
    });
    res.json({ success: true, data: favs.map((f) => f.partner) });
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/favourites/:partnerId
router.post('/me/favourites/:partnerId', authenticate, requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    await prisma.favourite.upsert({
      where: { userId_partnerId: { userId: req.user!.userId, partnerId: req.params.partnerId } },
      create: { userId: req.user!.userId, partnerId: req.params.partnerId },
      update: {},
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/me/favourites/:partnerId
router.delete('/me/favourites/:partnerId', authenticate, requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    await prisma.favourite.delete({
      where: { userId_partnerId: { userId: req.user!.userId, partnerId: req.params.partnerId } },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/v1/users/me/impact
router.get('/me/impact', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.order.aggregate({
      where: { userId: req.user!.userId, orderStatus: 'PICKED_UP' },
      _sum: { quantity: true },
    });
    const meals = result._sum.quantity ?? 0;
    res.json({ success: true, data: { mealsSaved: meals, co2SavedKg: (meals * 2.5).toFixed(2) } });
  } catch (err) { next(err); }
});

// GET /api/v1/users/me/saved-payment-methods
router.get('/me/saved-payment-methods', authenticate, async (req, res, next) => {
  try {
    const methods = await prisma.savedPaymentMethod.findMany({ where: { userId: req.user!.userId } });
    res.json({ success: true, data: methods });
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/saved-payment-methods
router.post('/me/saved-payment-methods', authenticate, async (req, res, next) => {
  try {
    const method = await prisma.savedPaymentMethod.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.json({ success: true, data: method });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/me/saved-payment-methods/:id
router.delete('/me/saved-payment-methods/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.savedPaymentMethod.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
