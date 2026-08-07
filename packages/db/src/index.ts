import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

export * from './schema.js';
export { schema };

export type Db = NodePgDatabase<typeof schema>;

/** Create a Drizzle client backed by a pg Pool. */
export function createDb(connectionString: string): { db: Db; pool: pg.Pool } {
  const pool = new pg.Pool({ connectionString });
  return { db: drizzle(pool, { schema, casing: 'snake_case' }), pool };
}

/**
 * Apply pending SQL migrations, then seed the default tenant.
 * Called by the gateway at boot and by the migrate CLI.
 */
export async function runMigrations(db: Db): Promise<void> {
  const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'migrations'
  );
  await migrate(db, { migrationsFolder });
  await db.execute(
    sql`INSERT INTO tenants (tenant_id, name, domain) VALUES ('default', 'Default Tenant', 'localhost') ON CONFLICT DO NOTHING`
  );
}
