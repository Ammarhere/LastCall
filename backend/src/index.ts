import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { prisma } from './config/db';
import { redis } from './config/redis';
import { initSocket } from './config/socket';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { startPayoutCron, startTemplateCron } from './services/payout.service';

// Routers
import authRouter          from './api/v1/auth/auth.router';
import usersRouter         from './api/v1/users/users.router';
import bagsRouter          from './api/v1/bags/bags.router';
import ordersRouter        from './api/v1/orders/orders.router';
import paymentsRouter      from './api/v1/payments/payments.router';
import partnersRouter      from './api/v1/partners/partners.router';
import templatesRouter     from './api/v1/partners/templates.router';
import reviewsRouter       from './api/v1/reviews/reviews.router';
import citiesRouter        from './api/v1/cities/cities.router';
import notificationsRouter from './api/v1/notifications/notifications.router';
import adminRouter         from './api/v1/admin/admin.router';

const app    = express();
const server = http.createServer(app);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      [env.FRONTEND_URL, env.ADMIN_URL],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use('/api/v1', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          authRouter);
app.use('/api/v1/users',         usersRouter);
app.use('/api/v1/bags',          bagsRouter);
app.use('/api/v1/orders',        ordersRouter);
app.use('/api/v1/payments',      paymentsRouter);
app.use('/api/v1/partners',              partnersRouter);
app.use('/api/v1/partners/me/templates', templatesRouter);
app.use('/api/v1/reviews',       reviewsRouter);
app.use('/api/v1/cities',        citiesRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin',         adminRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: (err as Error).message });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  await prisma.$connect();
  await redis.connect();
  initSocket(server);
  startPayoutCron();
  startTemplateCron();

  server.listen(env.PORT, () => {
    console.log(`🚀 Last Call API running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  });
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  process.exit(1);
});
