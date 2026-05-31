import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { uploadBagPhoto } from '../../../middleware/upload';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';
import { NotFoundError, ForbiddenError } from '../../../errors/AppError';
import { emitBagSoldOut, emitNewBagListing } from '../../../services/socket.service';
import { sendNewBagListingToFans } from '../../../services/fcm.service';

const router = Router();

/** Parse "HH:MM" string into total minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Base object schema (no refinements) — needed so .partial() works for updates
const bagBaseSchema = z.object({
  title:           z.string().min(1).max(120),
  description:     z.string().max(500).optional(),
  originalPrice:   z.number().positive().max(50000),
  discountedPrice: z.number().positive().max(50000),
  quantityTotal:   z.number().int().min(1).max(100),
  pickupDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'pickupDate must be YYYY-MM-DD'),
  pickupStart:     z.string().regex(/^\d{2}:\d{2}$/, 'pickupStart must be HH:MM'),
  pickupEnd:       z.string().regex(/^\d{2}:\d{2}$/, 'pickupEnd must be HH:MM'),
  tags:            z.array(z.string().max(30)).max(10).default([]),
  category:        z.string().max(50).optional(),
  areaId:          z.string().uuid().optional(),
});

// Create schema adds cross-field validation
const createSchema = bagBaseSchema.refine(
  (d) => timeToMinutes(d.pickupEnd) > timeToMinutes(d.pickupStart),
  { message: 'pickupEnd must be after pickupStart', path: ['pickupEnd'] },
).refine(
  (d) => d.discountedPrice < d.originalPrice,
  { message: 'discountedPrice must be less than originalPrice', path: ['discountedPrice'] },
);

// Update schema: all fields optional + status field
const updateSchema = bagBaseSchema.partial().extend({
  status: z.enum(['DRAFT', 'AVAILABLE', 'CANCELLED']).optional(),
});

const querySchema = z.object({
  city:      z.string().optional(),
  area:      z.string().optional(),
  date:      z.string().optional(),
  category:  z.string().optional(),
  priceMax:  z.coerce.number().optional(),
  lat:       z.coerce.number().optional(),
  lng:       z.coerce.number().optional(),
  sort:      z.enum(['price_asc', 'price_desc', 'distance', 'newest']).default('newest'),
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().positive().max(50).default(20),
});

// GET /api/v1/bags
router.get('/', validate(querySchema, 'query'), async (req, res, next) => {
  try {
    const { city, area, date, category, priceMax, page, limit } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'AVAILABLE',
      pickupDate: { gte: new Date(date ?? new Date().toISOString().split('T')[0]) },
    };
    if (city)      where.city = { slug: city };
    if (area)      where.area = { slug: area };
    if (category)  where.category = category;
    if (priceMax)  where.discountedPrice = { lte: Number(priceMax) };

    const [bags, total] = await Promise.all([
      prisma.bag.findMany({
        where,
        include: { partner: { select: { id: true, businessName: true, logoUrl: true, rating: true, area: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bag.count({ where }),
    ]);

    res.json({ success: true, data: bags, total, page, limit, hasMore: skip + bags.length < total });
  } catch (err) { next(err); }
});

// GET /api/v1/bags/featured
router.get('/featured', async (_req, res, next) => {
  try {
    const bags = await prisma.bag.findMany({
      where: { status: 'AVAILABLE', partner: { isFeatured: true } },
      include: { partner: { select: { id: true, businessName: true, logoUrl: true, rating: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: bags });
  } catch (err) { next(err); }
});

// GET /api/v1/bags/:id
router.get('/:id', async (req, res, next) => {
  try {
    const bag = await prisma.bag.findUnique({
      where: { id: req.params.id },
      include: {
        partner: { include: { city: true } },
        area:    true,
      },
    });
    if (!bag) throw new NotFoundError('Bag');
    res.json({ success: true, data: bag });
  } catch (err) { next(err); }
});

// POST /api/v1/bags
router.post('/', authenticate, requireRole('PARTNER'), uploadBagPhoto, validate(createSchema), async (req, res, next) => {
  try {
    const file = req.file as any;
    const photoUrl = file?.location ?? file?.path ?? null;
    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new NotFoundError('Partner profile');

    const bag = await prisma.bag.create({
      data: {
        ...req.body,
        partnerId:    partner.id,
        cityId:       partner.cityId,
        quantityLeft: req.body.quantityTotal,
        photoUrl,
        status:       'AVAILABLE',
        pickupDate:   new Date(req.body.pickupDate),
        pickupStart:  new Date(`1970-01-01T${req.body.pickupStart}:00`),
        pickupEnd:    new Date(`1970-01-01T${req.body.pickupEnd}:00`),
        mealsSaved:   req.body.quantityTotal,
        co2SavedKg:   req.body.quantityTotal * 2.5,
      },
    });

    await prisma.partner.update({
      where: { id: partner.id },
      data:  { totalBagsListed: { increment: 1 } },
    });

    // 🔔 Notify fans — fire-and-forget, never block the response
    Promise.allSettled([
      sendNewBagListingToFans(partner.id, {
        id:             bag.id,
        title:          bag.title,
        discountedPrice: bag.discountedPrice,
        quantityTotal:  bag.quantityTotal,
      }),
      emitNewBagListing({
        id:          bag.id,
        title:       bag.title,
        discountedPrice: bag.discountedPrice,
        partnerId:   partner.id,
        partnerName: partner.businessName,
        cityId:      partner.cityId,
      }),
    ]).catch(() => {});

    res.status(201).json({ success: true, data: bag });
  } catch (err) { next(err); }
});

// PATCH /api/v1/bags/:id
router.patch('/:id', authenticate, requireRole('PARTNER', 'ADMIN'), uploadBagPhoto, validate(updateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.bag.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Bag');

    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (req.user!.role === 'PARTNER' && existing.partnerId !== partner?.id) {
      throw new ForbiddenError('You do not own this bag');
    }

    const file = req.file as any;
    const photoUrl = file?.location ?? file?.path ?? existing.photoUrl;

    const bag = await prisma.bag.update({
      where: { id: req.params.id },
      data:  { ...req.body, photoUrl },
    });

    // Invalidate cache
    await redis.del(`bag:${req.params.id}`);

    res.json({ success: true, data: bag });
  } catch (err) { next(err); }
});

// DELETE /api/v1/bags/:id
router.delete('/:id', authenticate, requireRole('PARTNER', 'ADMIN'), async (req, res, next) => {
  try {
    const existing = await prisma.bag.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Bag');

    const partner = await prisma.partner.findUnique({ where: { userId: req.user!.userId } });
    if (req.user!.role === 'PARTNER' && existing.partnerId !== partner?.id) {
      throw new ForbiddenError('You do not own this bag');
    }

    await prisma.bag.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    emitBagSoldOut(req.params.id);
    await redis.del(`bag:${req.params.id}`);

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
