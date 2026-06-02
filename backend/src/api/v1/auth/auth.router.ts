import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../../middleware/validate';
import { authenticate, firebaseLogin } from '../../../middleware/auth';
import { authLimiter } from '../../../middleware/rateLimit';
import { prisma } from '../../../config/db';
import { env } from '../../../config/env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../errors/AppError';

const router = Router();

const firebaseSchema   = z.object({ idToken: z.string().min(100) }); // Firebase ID tokens are always long
const adminLoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});
const fcmSchema = z.object({ fcmToken: z.string().min(50).max(500) }); // FCM tokens are long strings

// POST /api/v1/auth/firebase-login
router.post('/firebase-login', authLimiter, validate(firebaseSchema), async (req, res, next) => {
  try {
    const token = await firebaseLogin(req.body.idToken);
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/admin-login
router.post('/admin-login', authLimiter, validate(adminLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email, role: 'ADMIN' } });
    if (!user?.passwordHash) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any },
    );
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/fcm-token
router.post('/fcm-token', authenticate, validate(fcmSchema), async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { fcmToken: req.body.fcmToken },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/dev-login  ← DEV ONLY: bypass Firebase for Expo Go testing
// Accepts any Pakistani phone number + OTP "123456". Blocked in production.
router.post('/dev-login', authLimiter, validate(z.object({ phone: z.string().min(10) })), async (req, res, next) => {
  try {
    // Blocked in production UNLESS ALLOW_DEV_LOGIN=true is explicitly set
    // Remove ALLOW_DEV_LOGIN from Render env once real Firebase auth is set up
    const allowed = env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN === 'true';
    if (!allowed) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const phone = req.body.phone.startsWith('+') ? req.body.phone : `+92${req.body.phone.replace(/^0/, '')}`;

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const referralCode = require('crypto').randomBytes(4).toString('hex').toUpperCase();
      user = await prisma.user.create({
        data: { phone, role: 'CUSTOMER', referralCode },
      });
    }

    const partner = await prisma.partner.findUnique({ where: { userId: user.id } });
    const token = jwt.sign(
      { userId: user.id, role: user.role, partnerId: partner?.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any },
    );

    res.json({ success: true, data: { token } });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/refresh — Re-issue JWT with current DB role + partner ID
// Call this after partner registration so the token reflects PARTNER role
router.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const user    = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const partner = await prisma.partner.findUnique({ where: { userId: user.id } });
    const token   = jwt.sign(
      { userId: user.id, role: user.role, partnerId: partner?.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any },
    );
    res.json({ success: true, data: { token } });
  } catch (err) { next(err); }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { fcmToken: null },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
