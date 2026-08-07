/**
 * Shared test database: one pg pool per vitest process, migrated once.
 * Tests run serially (see vitest.config.ts) so truncation between tests is safe.
 */
import { sql } from 'drizzle-orm';
import { createDb, runMigrations } from '@oauth-mcp-gateway/db';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://gateway:gateway@localhost:5432/gateway';

let shared: ReturnType<typeof createDb> | undefined;
let migrated: Promise<void> | undefined;

export function getTestDb(): ReturnType<typeof createDb> {
  shared ??= createDb(TEST_DATABASE_URL);
  return shared;
}

/** Run migrations once per process (idempotent). */
export async function migrateTestDb(): Promise<void> {
  migrated ??= runMigrations(getTestDb().db);
  await migrated;
}

/** Wipe all gateway domain tables and re-seed the 'default' tenant. */
export async function truncateAll(): Promise<void> {
  const { db } = getTestDb();
  // ponytail: every domain table has an ON DELETE CASCADE FK chain rooted at
  // tenants, so one DELETE empties them all. DELETE beats TRUNCATE here:
  // no ACCESS EXCLUSIVE locks, and the tables are tiny between tests.
  await db.execute(sql`DELETE FROM tenants`);
  await db.execute(
    sql`INSERT INTO tenants (tenant_id, name, domain) VALUES ('default', 'Default Tenant', 'localhost') ON CONFLICT DO NOTHING`
  );
}

/** Insert a tenant row (FK target for clients/servers/sessions/logs). */
export async function createTenant(tenantId: string, name = tenantId): Promise<void> {
  const { db } = getTestDb();
  await db.execute(
    sql`INSERT INTO tenants (tenant_id, name, domain) VALUES (${tenantId}, ${name}, ${`${tenantId}.test`}) ON CONFLICT DO NOTHING`
  );
}

export async function closeDb(): Promise<void> {
  if (shared) {
    await shared.pool.end();
    shared = undefined;
    migrated = undefined;
  }
}
