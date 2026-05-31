import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { uploadPartnerLogo, uploadPartnerCover, uploadDocument } from '../../../middleware/upload';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';
import { NotFoundError, ForbiddenError } from '../../../errors/AppError';
import { emitPartnerApproved } from '../../../services/socket.service';
import { sendPartnerApprovedNotif } from '../../../services/fcm.service';

const router = Router();

const PARTNER_CATEGORIES = [
  'Restaurant', 'Bakery', 'Café', 'Sweet Shop', 'Biryani', 'BBQ',
  'Fast Food', 'Snacks', 'Desserts', 'Juice Bar', 'Pizza', 'Other',
] as const;

const registerSchema = z.object({
  businessName:       z.string().min(2).max(100),
  category:           z.enum(PARTNER_CATEGORIES),
  description:        z.string().max(500).optional(),
  cityId:             z.string().uuid(),
  area:               z.string().max(100).optional(),
  address:            z.string().min(5).max(300),
  latitude:           z.number().min(-90).max(90).optional(),
  longitude:          z.number().min(-180).max(180).optional(),
  pickupInstructions: z.string().max(300).optional(),
});

const updateSchema = registerSchema.partial();

// GET /api/v1/partners
router.get('/', validate(z.object({
  city:     z.string().optional(),
  area:     z.string().optional(),
  category: z.string().optional(),
  page:     z.coerce.number().default(1),
  limit:    z.coerce.number().max(50).default(20),
}), 'query'), async (req, res, next) => {
  try {
    const { city, area, category, page, limit } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED' };
    if (city)     where.city = { slug: city };
    if (area)     where.area = { contains: area, mode: 'insensitive' };
    if (category) where.category = category;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        select: { id: true, businessName: true, slug: true, category: true, area: true, logoUrl: true, coverUrl: true, rating: true, reviewCount: true, isFeatured: true },
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      }),
      prisma.partner.count({ where }),
    ]);

    res.json({ success: true, data: partners, total, page, limit, hasMore: skip + partners.length < total });
  } catch (err) { next(err); }
});

// GET /api/v1/partners/me
router.get('/me', authenticate, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user!.userId },
      include: { city: true, documents: true },
    });
    if (!partner) throw new NotFoundError('Partner profile');
    res.json({ success: true, data: partner });
  } catch (err) { next(err); }
});

// GET /api/v1/partners/me/stats
router.get('/me/stats', authenticate, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new NotFoundError('Partner profile');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, activeBags, totalEarnings, waitingCustomers, activeTemplates] = await Promise.all([
      prisma.order.count({ where: { partnerId: partner.id, createdAt: { gte: today } } }),
      prisma.order.count({ where: { partnerId: partner.id, orderStatus: 'CONFIRMED' } }),
      prisma.bag.count({ where: { partnerId: partner.id, status: 'AVAILABLE' } }),
      prisma.order.aggregate({
        where: { partnerId: partner.id, orderStatus: 'PICKED_UP' },
        _sum:  { partnerPayoutAmt: true },
      }),
      // How many customers have favourited this partner — shown on dashboard as social proof
      prisma.favourite.count({ where: { partnerId: partner.id } }),
      // How many recurring templates are currently active
      prisma.bagTemplate.count({ where: { partnerId: partner.id, isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        activeBags,
        totalEarnings:    totalEarnings._sum.partnerPayoutAmt ?? 0,
        waitingCustomers,
        activeTemplates,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/partners/me/analytics
router.get('/me/analytics', authenticate, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new NotFoundError('Partner profile');

    // Validate and clamp date range (default: last 30 days, max: 1 year)
    const maxRange   = 365 * 24 * 60 * 60 * 1000;
    const rawFrom    = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rawTo      = req.query.to   ? new Date(req.query.to   as string) : new Date();

    if (isNaN(rawFrom.getTime()) || isNaN(rawTo.getTime())) {
      throw new Error('Invalid date format for from/to parameters');
    }
    if (rawFrom >= rawTo) throw new Error('from must be before to');
    const from = new Date(Math.max(rawFrom.getTime(), rawTo.getTime() - maxRange)); // cap at 1 year
    const to   = rawTo;

    const orders = await prisma.order.findMany({
      where: { partnerId: partner.id, createdAt: { gte: from, lte: to } },
      select: { id: true, totalAmount: true, partnerPayoutAmt: true, quantity: true, orderStatus: true, createdAt: true, bag: { select: { title: true } } },
    });

    const revenue = orders.reduce((acc, o) => acc + (o.orderStatus === 'PICKED_UP' ? o.partnerPayoutAmt : 0), 0);
    const bagPerformance: Record<string, { title: string; sold: number; revenue: number }> = {};
    for (const o of orders) {
      const key = o.bag.title;
      if (!bagPerformance[key]) bagPerformance[key] = { title: key, sold: 0, revenue: 0 };
      bagPerformance[key].sold += o.quantity;
      bagPerformance[key].revenue += o.partnerPayoutAmt;
    }

    res.json({
      success: true,
      data: {
        totalOrders:  orders.length,
        revenue,
        bagPerformance: Object.values(bagPerformance).sort((a, b) => b.sold - a.sold),
        orders,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/partners/me/payouts
router.get('/me/payouts', authenticate, requireRole('PARTNER'), async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new NotFoundError('Partner profile');
    const payouts = await prisma.payout.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payouts });
  } catch (err) { next(err); }
});

// GET /api/v1/partners/:id
router.get('/:id', async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: req.params.id, status: 'APPROVED' },
      include: {
        city: true,
        bags: {
          where: { status: 'AVAILABLE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!partner) throw new NotFoundError('Partner');
    res.json({ success: true, data: partner });
  } catch (err) { next(err); }
});

// POST /api/v1/partners/register
router.post('/register', authenticate, validate(registerSchema), async (req, res, next) => {
  try {
    const slug = req.body.businessName
      .toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const partner = await prisma.partner.create({
      data: {
        ...req.body,
        userId: req.user!.userId,
        slug:   `${slug}-${Date.now()}`,
        status: 'PENDING',
      },
    });

    await prisma.user.update({ where: { id: req.user!.userId }, data: { role: 'PARTNER' } });

    res.status(201).json({ success: true, data: partner });
  } catch (err) { next(err); }
});

// PATCH /api/v1/partners/me
router.patch('/me', authenticate, requireRole('PARTNER'), uploadPartnerLogo, validate(updateSchema), async (req, res, next) => {
  try {
    const file = req.file as any;
    const logoUrl = file?.location ?? file?.path ?? undefined;
    const partner = await prisma.partner.update({
      where: { userId: req.user!.userId },
      data:  { ...req.body, ...(logoUrl ? { logoUrl } : {}) },
    });
    await redis.del(`partner:${partner.id}`);
    res.json({ success: true, data: partner });
  } catch (err) { next(err); }
});

// POST /api/v1/partners/me/documents
router.post('/me/documents', authenticate, requireRole('PARTNER'), uploadDocument, async (req, res, next) => {
  try {
    const file = req.file as any;
    const fileUrl = file?.location ?? file?.path;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new NotFoundError('Partner profile');

    const doc = await prisma.partnerDocument.create({
      data: {
        partnerId: partner.id,
        type:      req.body.type,
        fileUrl,
      },
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
});

export { emitPartnerApproved, sendPartnerApprovedNotif };
export default router;
