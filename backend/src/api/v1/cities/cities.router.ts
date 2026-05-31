import { Router } from 'express';
import { prisma } from '../../../config/db';
import { redis } from '../../../config/redis';

const router = Router();

const CACHE_KEY = 'cities:all';

// GET /api/v1/cities
router.get('/', async (_req, res, next) => {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return res.json({ success: true, data: JSON.parse(cached) });

    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, latitude: true, longitude: true },
    });

    await redis.setex(CACHE_KEY, 86400, JSON.stringify(cities));
    res.json({ success: true, data: cities });
  } catch (err) { next(err); }
});

// GET /api/v1/cities/:cityId/areas
router.get('/:cityId/areas', async (req, res, next) => {
  try {
    const areas = await prisma.area.findMany({
      where: { cityId: req.params.cityId, isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: areas });
  } catch (err) { next(err); }
});

export default router;
