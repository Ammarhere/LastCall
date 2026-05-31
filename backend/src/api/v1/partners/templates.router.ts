import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { uploadBagPhoto } from '../../../middleware/upload';
import { prisma } from '../../../config/db';
import { NotFoundError, ForbiddenError } from '../../../errors/AppError';

const router = Router();

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

// Base object — no refinements so .partial() works for PATCH
const templateBaseSchema = z.object({
  title:           z.string().min(1).max(120),
  description:     z.string().max(500).optional(),
  originalPrice:   z.number().positive().max(50000),
  discountedPrice: z.number().positive().max(50000),
  quantityTotal:   z.number().int().min(1).max(100),
  pickupStart:     z.string().regex(/^\d{2}:\d{2}$/),
  pickupEnd:       z.string().regex(/^\d{2}:\d{2}$/),
  activeDays:      z.array(z.enum(DAYS)).min(1),
  tags:            z.array(z.string().max(30)).max(10).default([]),
  category:        z.string().max(50).optional(),
  isActive:        z.boolean().default(true),
});

// Full create schema — adds cross-field validation
const templateSchema = templateBaseSchema.refine(
  (d) => {
    const [sh, sm] = d.pickupStart.split(':').map(Number);
    const [eh, em] = d.pickupEnd.split(':').map(Number);
    return eh * 60 + em > sh * 60 + sm;
  },
  { message: 'pickupEnd must be after pickupStart', path: ['pickupEnd'] },
).refine(
  (d) => d.discountedPrice < d.originalPrice,
  { message: 'discountedPrice must be less than originalPrice', path: ['discountedPrice'] },
);

// All routes require PARTNER auth
router.use(authenticate, requireRole('PARTNER'));

async function getPartnerOrFail(userId: string) {
  const partner = await prisma.partner.findUnique({ where: { userId } });
  if (!partner) throw new NotFoundError('Partner profile');
  return partner;
}

// GET /api/v1/partners/me/templates
router.get('/', async (req, res, next) => {
  try {
    const partner = await getPartnerOrFail(req.user!.userId);
    const templates = await prisma.bagTemplate.findMany({
      where:   { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
});

// POST /api/v1/partners/me/templates
router.post('/', uploadBagPhoto, validate(templateSchema), async (req, res, next) => {
  try {
    const partner  = await getPartnerOrFail(req.user!.userId);
    const file     = req.file as any;
    const photoUrl = file?.location ?? file?.path ?? null;

    const template = await prisma.bagTemplate.create({
      data: {
        ...req.body,
        partnerId: partner.id,
        photoUrl,
      },
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) { next(err); }
});

// PATCH /api/v1/partners/me/templates/:id
router.patch('/:id', uploadBagPhoto, validate(templateBaseSchema.partial()), async (req, res, next) => {
  try {
    const partner  = await getPartnerOrFail(req.user!.userId);
    const existing = await prisma.bagTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Template');
    if (existing.partnerId !== partner.id) throw new ForbiddenError('Not your template');

    const file     = req.file as any;
    const photoUrl = file?.location ?? file?.path ?? existing.photoUrl;

    const template = await prisma.bagTemplate.update({
      where: { id: req.params.id },
      data:  { ...req.body, photoUrl },
    });
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// PATCH /api/v1/partners/me/templates/:id/toggle
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const partner  = await getPartnerOrFail(req.user!.userId);
    const existing = await prisma.bagTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Template');
    if (existing.partnerId !== partner.id) throw new ForbiddenError('Not your template');

    const template = await prisma.bagTemplate.update({
      where: { id: req.params.id },
      data:  { isActive: !existing.isActive },
    });
    res.json({ success: true, data: template });
  } catch (err) { next(err); }
});

// DELETE /api/v1/partners/me/templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const partner  = await getPartnerOrFail(req.user!.userId);
    const existing = await prisma.bagTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Template');
    if (existing.partnerId !== partner.id) throw new ForbiddenError('Not your template');

    await prisma.bagTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
