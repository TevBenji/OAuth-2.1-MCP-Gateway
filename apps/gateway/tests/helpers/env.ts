/**
 * Builds a full Bindings env backed by the shared test Postgres database.
 */
import type { Bindings } from '../../src/types/bindings';
import { PgSessionStorage } from '../../src/storage/pg-session-storage';
import { MemoryKV } from '../../src/lib/memory-kv';
import { getTestDb } from './db';

export function makeTestEnv(overrides: Partial<Bindings> = {}): Bindings {
  const { db } = getTestDb();
  return {
    ENVIRONMENT: 'development',
    JWT_ISSUER: 'http://localhost:8787',
    JWT_SECRET: 'test-secret-key-for-testing-only-0123456789',
    TENANT_ID: 'default',
    CORS_ORIGINS: 'http://localhost:3000',
    ADMIN_TOKEN: 'test-admin-token',
    DB: db,
    SESSIONS: new PgSessionStorage(db),
    CACHE: new MemoryKV(),
    ...overrides,
  };
}
