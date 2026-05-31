import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../config/db';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { UserRole } from '@lastcall/shared';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  partnerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing token');

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

/** Exchange a Firebase ID token for a LastCall JWT */
export async function firebaseLogin(firebaseIdToken: string): Promise<string> {
  const decoded = await firebaseAuth.verifyIdToken(firebaseIdToken);
  const phone = decoded.phone_number;
  if (!phone) throw new UnauthorizedError('Firebase token has no phone number');

  // Upsert user
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    user = await prisma.user.create({
      data: {
        phone,
        firebaseUid: decoded.uid,
        referralCode,
        role: 'CUSTOMER',
      },
    });
  } else if (!user.firebaseUid) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid: decoded.uid },
    });
  }

  const partner = await prisma.partner.findUnique({ where: { userId: user.id } });

  const payload: AuthPayload = {
    userId: user.id,
    role: user.role as UserRole,
    partnerId: partner?.id,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}
