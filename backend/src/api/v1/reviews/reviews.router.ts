import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { prisma } from '../../../config/db';
import { AppError, NotFoundError } from '../../../errors/AppError';

const router = Router();

const reviewSchema = z.object({
  orderId:  z.string().uuid(),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().max(500).optional(),
});

// POST /api/v1/reviews
router.post('/', authenticate, requireRole('CUSTOMER'), validate(reviewSchema), async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.userId !== req.user!.userId) throw new AppError('Not your order', 403);
    if (order.orderStatus !== 'PICKED_UP') throw new AppError('Can only review after pickup', 400);

    const review = await prisma.review.create({
      data: {
        orderId,
        userId:    req.user!.userId,
        partnerId: order.partnerId,
        rating,
        comment,
      },
    });

    // Update partner aggregate rating
    const agg = await prisma.review.aggregate({
      where: { partnerId: order.partnerId, isVisible: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.partner.update({
      where: { id: order.partnerId },
      data: {
        rating:      agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// GET /api/v1/reviews/partner/:partnerId
router.get('/partner/:partnerId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { partnerId: req.params.partnerId, isVisible: true },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});

// PATCH /api/v1/reviews/:id/reply  — Partner replies to a customer review
router.patch('/:id/reply', authenticate, requireRole('PARTNER'), validate(z.object({
  reply: z.string().min(1).max(500),
})), async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new NotFoundError('Review');

    // Ensure this partner owns the review
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner || review.partnerId !== partner.id) {
      throw new AppError('You can only reply to reviews for your own business', 403);
    }
    if (!review.isVisible) throw new AppError('Review is not visible', 400);

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data:  { partnerReply: req.body.reply, partnerRepliedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/v1/reviews/:id
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.review.update({ where: { id: req.params.id }, data: { isVisible: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
