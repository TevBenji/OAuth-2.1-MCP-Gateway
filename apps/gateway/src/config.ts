/**
 * Environment configuration, validated at startup.
 */
import { z } from 'zod';

const ConfigSchema = z
  .object({
    ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8787),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_ISSUER: z.string().url().default('http://localhost:8787'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    /** Bearer token required for /admin/api/* (the dashboard's service token). */
    ADMIN_TOKEN: z.string().optional(),
    TENANT_ID: z.string().default('default'),
    /** JSON map of upstream signing secrets, keyed by server_id or resource_identifier. */
    UPSTREAM_HMAC_SECRETS: z.string().optional(),
    /** 'postgres' shares rate-limit counters and IP blocks across replicas. */
    RATE_LIMIT_STORAGE: z.enum(['memory', 'postgres']).default('memory'),
  })
  .refine(c => c.ENVIRONMENT !== 'production' || c.JWT_SECRET.length >= 32, {
    message: 'JWT_SECRET must be at least 32 characters in production',
  })
  .refine(c => c.ENVIRONMENT !== 'production' || c.ADMIN_TOKEN, {
    message: 'ADMIN_TOKEN is required in production',
  });

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    console.error('Invalid configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid configuration');
  }
  return parsed.data;
}
