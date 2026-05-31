import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from '../errors/AppError';

interface RateLimitOptions {
  window: number;   // seconds
  max: number;      // requests per window
}

export function rateLimit(opts: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip ?? 'unknown';
    const key = `rate:${ip}:${req.path}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, opts.window);
      }
      if (current > opts.max) {
        return next(new AppError('Too many requests, please try again later', 429, 'RATE_LIMITED'));
      }
      next();
    } catch {
      // If Redis is down, don't block requests
      next();
    }
  };
}

// Pre-configured rate limiters
export const authLimiter    = rateLimit({ window: 60,  max: 10  });
export const apiLimiter     = rateLimit({ window: 60,  max: 100 });
export const paymentLimiter = rateLimit({ window: 60,  max: 20  });
