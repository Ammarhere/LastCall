import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  NODE_ENV:   z.enum(['development', 'production', 'test']).default('development'),
  PORT:       z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL:    z.string().min(1),

  JWT_SECRET:     z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  FIREBASE_PROJECT_ID:   z.string().min(1),
  FIREBASE_PRIVATE_KEY:  z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),

  AWS_ACCESS_KEY_ID:     z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME:       z.string().optional(),
  AWS_REGION:            z.string().default('ap-south-1'),

  TWILIO_ACCOUNT_SID:    z.string().optional(),
  TWILIO_AUTH_TOKEN:     z.string().optional(),
  TWILIO_WHATSAPP_FROM:  z.string().optional(),

  SENDGRID_API_KEY:    z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  JAZZCASH_MERCHANT_ID:      z.string().optional(),
  JAZZCASH_PASSWORD:         z.string().optional(),
  JAZZCASH_INTEGRITY_SALT:   z.string().optional(),
  EASYPAISA_STORE_ID:        z.string().optional(),
  EASYPAISA_HASH_KEY:        z.string().optional(),
  SADAPAY_SECRET_KEY:        z.string().optional(),
  SADAPAY_WEBHOOK_SECRET:    z.string().optional(),
  NAYAPAY_API_KEY:           z.string().optional(),
  NAYAPAY_WEBHOOK_SECRET:    z.string().optional(),
  RAAST_API_KEY:             z.string().optional(),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL:    z.string().url().default('http://localhost:5173'),

  CRON_PAYOUT_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
