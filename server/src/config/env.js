import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORTAL_JWT_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  CRON_REMINDER: z.string().default('0 8 * * *'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
