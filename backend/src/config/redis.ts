import Redis from 'ioredis';
import { env } from './env';

const isTLS = env.REDIS_URL.startsWith('rediss://');

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect:          true,
  maxRetriesPerRequest: 3,
  // TLS required for Upstash — automatically enabled when URL uses rediss://
  ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});
