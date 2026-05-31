import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { prisma } from '../../../config/db';

const router = Router();

// GET /api/v1/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifs });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data:  { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data:  { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
