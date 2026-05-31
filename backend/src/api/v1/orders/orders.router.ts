import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { rateLimit } from '../../../middleware/rateLimit';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';
import { NotFoundError, ForbiddenError, AppError } from '../../../errors/AppError';
import { emitOrderStatusChanged, emitNewOrderToPartner, emitBagSoldOut } from '../../../services/socket.service';
import { sendOrderConfirmationWhatsApp } from '../../../services/whatsapp.service';
import { sendOrderPush } from '../../../services/fcm.service';

const router = Router();

const createSchema = z.object({
  bagId:         z.string().uuid(),
  quantity:      z.number().int().min(1).max(10).default(1),
  paymentMethod: z.enum(['CASH', 'JAZZCASH', 'EASYPAISA', 'SADAPAY', 'NAYAPAY', 'RAAST', 'BANK_TRANSFER']),
  promoCode:     z.string().max(30).optional(),
});

const statusSchema = z.object({ status: z.enum(['READY', 'PICKED_UP']) });

const verifySchema = z.object({
  pickupCode:    z.string().min(6).max(12),
  cashConfirmed: z.boolean(),
});

/** Cryptographically random 8-char alphanumeric pickup code */
function generatePickupCode(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
}

// POST /api/v1/orders
router.post('/', authenticate, requireRole('CUSTOMER'), rateLimit({ window: 60, max: 10 }), validate(createSchema), async (req, res, next) => {
  try {
    const { bagId, quantity, paymentMethod, promoCode } = req.body;

    // ─── Promo validation (outside transaction — read-only) ────────────────────
    let discount = 0;
    let promotion: any = null;
    if (promoCode) {
      const code = promoCode.toUpperCase().trim();
      promotion = await prisma.promotion.findUnique({ where: { code } });
      if (promotion) {
        if (!promotion.isActive) throw new AppError('Promo code is inactive', 400, 'PROMO_INACTIVE');
        if (new Date() > promotion.validUntil) throw new AppError('Promo code has expired', 400, 'PROMO_EXPIRED');
        if (new Date() < promotion.validFrom) throw new AppError('Promo code is not yet valid', 400, 'PROMO_NOT_STARTED');
        if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) {
          throw new AppError('Promo code has reached its usage limit', 400, 'PROMO_EXHAUSTED');
        }
        // Check if this user already used this promo
        const alreadyUsed = await prisma.promotionUse.findFirst({
          where: { promotionId: promotion.id, userId: req.user!.userId },
        });
        if (alreadyUsed) throw new AppError('You have already used this promo code', 400, 'PROMO_ALREADY_USED');
      }
    }

    // ─── Atomic bag reservation (database-level race condition safe) ───────────
    // Use updateMany with quantityLeft > 0 condition — if it affects 0 rows, bag is gone.
    const updated = await prisma.bag.updateMany({
      where: {
        id:           bagId,
        status:       'AVAILABLE',
        quantityLeft: { gte: quantity },
        partner:      { status: 'APPROVED' },      // Fix: suspended partners cannot sell
      },
      data: { quantityLeft: { decrement: quantity } },
    });

    if (updated.count === 0) {
      // Double-check why it failed to give a clear error
      const bag = await prisma.bag.findUnique({ where: { id: bagId }, include: { partner: true } });
      if (!bag) throw new NotFoundError('Bag');
      if (bag.partner.status !== 'APPROVED') throw new AppError('This partner is not currently active', 400);
      throw new AppError('Bag is no longer available — it may have just sold out', 400, 'BAG_UNAVAILABLE');
    }

    // Re-fetch the updated bag to get current data + lock commission rate at bag creation time
    const bag = await prisma.bag.findUniqueOrThrow({
      where: { id: bagId },
      include: { partner: true },
    });

    // Mark sold out if now empty
    if (bag.quantityLeft === 0) {
      await prisma.bag.update({ where: { id: bagId }, data: { status: 'SOLD_OUT' } });
      emitBagSoldOut(bagId);
    }

    // ─── Calculate financials ──────────────────────────────────────────────────
    const unitPrice       = bag.discountedPrice;
    const rawTotal        = unitPrice * quantity;
    // Lock commission at partner's CURRENT rate (stored in bag's partner at order time)
    const commissionPct   = bag.partner.commissionPct;

    if (promotion) {
      const flatDiscount  = promotion.discountFlat ?? 0;
      const pctDiscount   = promotion.discountPct  ? rawTotal * (promotion.discountPct / 100) : 0;
      discount            = Math.min(rawTotal, flatDiscount + pctDiscount); // never exceed order total
    }

    const totalAmount      = parseFloat(Math.max(0, rawTotal - discount).toFixed(2));
    const commissionAmt    = parseFloat((totalAmount * (commissionPct / 100)).toFixed(2));
    const partnerPayoutAmt = parseFloat((totalAmount - commissionAmt).toFixed(2));
    const pickupCode       = generatePickupCode();

    const order = await prisma.order.create({
      data: {
        bagId,
        userId:          req.user!.userId,
        partnerId:       bag.partnerId,
        quantity,
        unitPrice,
        totalAmount,
        commissionAmt,
        partnerPayoutAmt,
        paymentMethod,
        paymentStatus:   'PENDING',
        orderStatus:     'CONFIRMED',
        pickupCode,
      },
      include: { bag: { include: { partner: true } }, user: true },
    });

    // ─── Apply promo ───────────────────────────────────────────────────────────
    if (promotion) {
      await prisma.$transaction([
        prisma.promotionUse.create({
          data: { promotionId: promotion.id, userId: req.user!.userId, orderId: order.id },
        }),
        prisma.promotion.update({
          where: { id: promotion.id },
          data:  { usedCount: { increment: 1 } },
        }),
      ]);
    }

    // ─── For cash orders, mark as PAID immediately ─────────────────────────────
    if (paymentMethod === 'CASH') {
      await prisma.order.update({
        where: { id: order.id },
        data:  { paymentStatus: 'PENDING' }, // paid at pickup — see verify-pickup
      });
    }

    // ─── Notifications (fire-and-forget — never block the response) ────────────
    Promise.allSettled([
      sendOrderConfirmationWhatsApp(order),
      sendOrderPush(order.userId, order.id, 'Order Confirmed', `Your pickup code is ${pickupCode}`),
      sendOrderPush(order.partnerId, order.id, 'New Order!',   `${order.user.name ?? 'Customer'} ordered ${quantity}x ${order.bag.title}`),
    ]).catch(() => {});

    emitNewOrderToPartner(order.partnerId, order);

    // ─── Invalidate cache ──────────────────────────────────────────────────────
    await redis.del(`bag:${bagId}`);

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// GET /api/v1/orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role, userId, partnerId } = req.user!;
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip  = (page - 1) * limit;

    const where: any = role === 'CUSTOMER'
      ? { userId }
      : role === 'PARTNER'
      ? { partnerId }
      : {};                    // admin sees all

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          bag:     { select: { title: true, photoUrl: true, pickupDate: true } },
          partner: { select: { businessName: true, logoUrl: true } },
          user:    { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take:    limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, total, page, limit, hasMore: skip + orders.length < total });
  } catch (err) { next(err); }
});

// GET /api/v1/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        bag:     true,
        partner: { include: { city: true } },
        user:    { select: { name: true, phone: true, avatarUrl: true } },
        review:  true,
      },
    });
    if (!order) throw new NotFoundError('Order');
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) throw new ForbiddenError();
    if (req.user!.role === 'PARTNER'  && order.partnerId !== req.user!.partnerId) throw new ForbiddenError();
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// PATCH /api/v1/orders/:id/status
router.patch('/:id/status', authenticate, requireRole('PARTNER', 'ADMIN'), validate(statusSchema), async (req, res, next) => {
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Order');
    if (req.user!.role === 'PARTNER' && existing.partnerId !== req.user!.partnerId) throw new ForbiddenError();

    // Enforce valid status transitions
    const transitions: Record<string, string[]> = {
      CONFIRMED: ['READY'],
      READY:     ['PICKED_UP'],
    };
    if (!transitions[existing.orderStatus]?.includes(req.body.status)) {
      throw new AppError(`Cannot transition from ${existing.orderStatus} to ${req.body.status}`, 400, 'INVALID_TRANSITION');
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data:  {
        orderStatus: req.body.status,
        ...(req.body.status === 'PICKED_UP' ? { pickedUpAt: new Date() } : {}),
      },
      include: { user: true },
    });

    emitOrderStatusChanged(order.userId, order.id, order.orderStatus);
    sendOrderPush(order.userId, order.id, `Order ${order.orderStatus}`, getStatusMessage(order.orderStatus)).catch(() => {});

    if (order.orderStatus === 'PICKED_UP') {
      await prisma.partner.update({
        where: { id: order.partnerId },
        data:  { totalBagsSold: { increment: order.quantity } },
      });
    }

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:id/verify-pickup
router.post('/:id/verify-pickup', authenticate, requireRole('PARTNER'), validate(verifySchema), async (req, res, next) => {
  try {
    const { pickupCode, cashConfirmed } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new NotFoundError('Order');
    if (order.partnerId !== req.user!.partnerId) throw new ForbiddenError();
    if (order.orderStatus === 'PICKED_UP') throw new AppError('Order already picked up', 400, 'ALREADY_PICKED_UP');
    if (order.orderStatus === 'CANCELLED') throw new AppError('Order is cancelled', 400, 'ORDER_CANCELLED');

    // Constant-time comparison to prevent timing attacks on pickup codes
    const codeA = Buffer.from(order.pickupCode.toUpperCase());
    const codeB = Buffer.from(pickupCode.toUpperCase().slice(0, order.pickupCode.length).padEnd(order.pickupCode.length, '\0'));
    // Buffers must be exactly same length for timingSafeEqual
    const codesMatch = codeA.length === codeB.length && crypto.timingSafeEqual(codeA, codeB);
    if (!codesMatch) throw new AppError('Invalid pickup code', 400, 'INVALID_CODE');

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data:  {
        orderStatus:   'PICKED_UP',
        pickedUpAt:    new Date(),
        paymentStatus: cashConfirmed ? 'PAID' : order.paymentStatus,
      },
    });

    await prisma.partner.update({
      where: { id: order.partnerId },
      data:  { totalBagsSold: { increment: order.quantity } },
    });

    emitOrderStatusChanged(order.userId, order.id, 'PICKED_UP');
    sendOrderPush(order.userId, order.id, 'Pickup Confirmed', "Enjoy your meal! Don't forget to leave a review.").catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', authenticate, rateLimit({ window: 60, max: 5 }), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new NotFoundError('Order');
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) throw new ForbiddenError();
    if (!['CONFIRMED', 'READY'].includes(order.orderStatus)) {
      throw new AppError('Order cannot be cancelled at this stage', 400, 'CANNOT_CANCEL');
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data:  {
          orderStatus:  'CANCELLED',
          cancelledAt:  new Date(),
          cancelReason: (req.body.reason as string | undefined) ?? 'Cancelled by user',
          ...(order.paymentMethod !== 'CASH' ? { refundInitiatedAt: new Date() } : {}),
        },
      }),
      prisma.bag.update({
        where: { id: order.bagId },
        data:  { quantityLeft: { increment: order.quantity }, status: 'AVAILABLE' },
      }),
    ]);

    sendOrderPush(order.userId, order.id, 'Order Cancelled', 'Your order has been cancelled.').catch(() => {});

    res.json({ success: true });
  } catch (err) { next(err); }
});

function getStatusMessage(status: string): string {
  const msgs: Record<string, string> = {
    READY:     'Your order is ready for pickup!',
    PICKED_UP: 'Order picked up. Enjoy your meal!',
    CANCELLED: 'Your order has been cancelled.',
  };
  return msgs[status] ?? `Order status: ${status}`;
}

export default router;
