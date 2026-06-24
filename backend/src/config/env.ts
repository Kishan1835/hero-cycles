import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('300'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud — a misconfigured deployment should never start.
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  corsOrigin: parsed.data.CORS_ORIGIN,
  rateLimitWindowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
};
