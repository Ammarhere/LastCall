import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';
import { emitPartnerApproved } from '../../../services/socket.service';
import { sendPartnerApprovedNotif } from '../../../services/fcm.service';
import bcrypt from 'bcryptjs';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/v1/admin/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPartners,
      pendingPartners,
      totalOrders,
      todayOrders,
      gmvResult,
      todayGmvResult,
      activeBags,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.partner.count({ where: { status: 'APPROVED' } }),
      prisma.partner.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { orderStatus: 'PICKED_UP' }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { orderStatus: 'PICKED_UP', createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.bag.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const gmv       = gmvResult._sum.totalAmount      ?? 0;
    const todayGmv  = todayGmvResult._sum.totalAmount ?? 0;
    const revenue   = gmv * 0.20; // 20% commission

    res.json({
      success: true,
      data: { totalUsers, totalPartners, pendingPartners, totalOrders, todayOrders, gmv, todayGmv, revenue, activeBags },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/partners
router.get('/partners', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query as any;
    const where: any = status ? { status } : {};
    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: { user: { select: { phone: true, email: true } }, city: true, _count: { select: { orders: true, bags: true } } },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partner.count({ where }),
    ]);
    res.json({ success: true, data: partners, total });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/partners/:id/status
router.patch('/partners/:id/status', validate(z.object({
  status:        z.enum(['APPROVED', 'SUSPENDED']),
  commissionPct: z.number().min(0).max(100).optional(), // allow adjusting commission on approval
})), async (req, res, next) => {
  try {
    const before = await prisma.partner.findUnique({ where: { id: req.params.id } });
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data:  {
        status:        req.body.status,
        ...(req.body.commissionPct !== undefined ? { commissionPct: req.body.commissionPct } : {}),
      },
      include: { user: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId:    req.user!.userId,
        action:     `partner_${req.body.status.toLowerCase()}`,
        entityType: 'partner',
        entityId:   req.params.id,
        before:     { status: before?.status, commissionPct: before?.commissionPct },
        after:      { status: req.body.status, commissionPct: partner.commissionPct },
        ipAddress:  (req as any).ip,
      },
    });

    if (req.body.status === 'APPROVED') {
      emitPartnerApproved(partner.id);
      if (partner.user.fcmToken) await sendPartnerApprovedNotif(partner.user.fcmToken);
    }

    res.json({ success: true, data: partner });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/partners/:id/documents
router.get('/partners/:id/documents', async (req, res, next) => {
  try {
    const docs = await prisma.partnerDocument.findMany({ where: { partnerId: req.params.id } });
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/partners/:id/documents/:docId
router.patch('/partners/:id/documents/:docId', async (req, res, next) => {
  try {
    const doc = await prisma.partnerDocument.update({
      where: { id: req.params.docId },
      data:  { verifiedAt: new Date(), verifiedById: req.user!.userId },
    });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query as any;
    const where: any = status ? { orderStatus: status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:    { select: { name: true, phone: true } },
          partner: { select: { businessName: true } },
          bag:     { select: { title: true } },
        },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, data: orders, total });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query as any;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true, name: true, phone: true, email: true, createdAt: true, _count: { select: { orders: true } } },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    res.json({ success: true, data: users, total });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/users/admin
router.post('/users/admin', validate(z.object({ email: z.string().email(), password: z.string().min(10), name: z.string().min(2) })), async (req, res, next) => {
  try {
    // Check email uniqueness explicitly (phone is unused for admins)
    const exists = await prisma.user.findFirst({ where: { email: req.body.email } });
    if (exists) throw new Error('An account with this email already exists');

    const passwordHash = await bcrypt.hash(req.body.password, 14); // 14 rounds for admin accounts
    const referralCode = require('crypto').randomBytes(4).toString('hex').toUpperCase();
    // Phone must be unique — use a stable, non-guessable placeholder based on email hash
    const phoneSlug    = require('crypto').createHash('sha256').update(req.body.email).digest('hex').slice(0, 12);
    const user = await prisma.user.create({
      data: {
        phone:        `adm_${phoneSlug}`,
        email:        req.body.email,
        name:         req.body.name,
        passwordHash,
        role:         'ADMIN',
        referralCode,
      },
    });
    res.status(201).json({ success: true, data: { id: user.id, email: user.email } });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/payouts
router.get('/payouts', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query as any;
    const where: any = status ? { status } : {};
    const payouts = await prisma.payout.findMany({
      where,
      include: { partner: { select: { businessName: true, logoUrl: true } } },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payouts });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/payouts/:id
router.patch('/payouts/:id', validate(z.object({ status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']), txnRef: z.string().optional() })), async (req, res, next) => {
  try {
    const payout = await prisma.payout.update({
      where: { id: req.params.id },
      data:  {
        status:      req.body.status,
        txnRef:      req.body.txnRef,
        processedAt: req.body.status === 'COMPLETED' ? new Date() : undefined,
      },
    });
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
});

const promotionBaseSchema = z.object({
  code:         z.string().min(3).max(30).toUpperCase().optional(),
  title:        z.string().min(2).max(100),
  description:  z.string().max(500).optional(),
  discountPct:  z.number().min(0).max(100).optional(),
  discountFlat: z.number().min(0).optional(),
  minOrderAmt:  z.number().min(0).optional(),
  maxUses:      z.number().int().positive().optional(),
  validFrom:    z.coerce.date(),
  validUntil:   z.coerce.date(),
  cityId:       z.string().uuid().optional(),
  isActive:     z.boolean().default(true),
  bannerUrl:    z.string().url().optional(),
});

const promotionSchema = promotionBaseSchema
  .refine((d) => d.validFrom < d.validUntil, { message: 'validFrom must be before validUntil' })
  .refine((d) => d.discountPct !== undefined || d.discountFlat !== undefined, {
    message: 'Either discountPct or discountFlat must be specified',
  });

// POST /api/v1/admin/promotions
router.post('/promotions', validate(promotionSchema), async (req, res, next) => {
  try {
    const promo = await prisma.promotion.create({ data: req.body });
    res.status(201).json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/promotions/:id
router.patch('/promotions/:id', validate(promotionBaseSchema.partial()), async (req, res, next) => {
  try {
    const promo = await prisma.promotion.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: promo });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/impact
router.get('/impact', async (_req, res, next) => {
  try {
    const result = await prisma.order.aggregate({
      where: { orderStatus: 'PICKED_UP' },
      _sum: { quantity: true },
      _count: true,
    });
    const meals     = result._sum.quantity ?? 0;
    const co2       = meals * 2.5;
    const bags      = result._count;
    const customers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const partners  = await prisma.partner.count({ where: { status: 'APPROVED' } });

    res.json({
      success: true,
      data: { mealsSaved: meals, co2SavedKg: co2, bagsSaved: bags, customerCount: customers, partnerCount: partners },
    });
  } catch (err) { next(err); }
});

// POST /api/v1/admin/cities
router.post('/cities', async (req, res, next) => {
  try {
    const city = await prisma.city.create({ data: req.body });
    await redis.del('cities:all');
    res.status(201).json({ success: true, data: city });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/cities/:id
router.patch('/cities/:id', async (req, res, next) => {
  try {
    const city = await prisma.city.update({ where: { id: req.params.id }, data: req.body });
    await redis.del('cities:all');
    res.json({ success: true, data: city });
  } catch (err) { next(err); }
});

export default router;
