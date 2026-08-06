/**
 * Applies pending SQL migrations, then seeds the default development tenant.
 * Usage: DATABASE_URL=postgres://... pnpm --filter @oauth-mcp-gateway/db migrate
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { createDb } from './index.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const { db, pool } = createDb(url);
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

await migrate(db, { migrationsFolder });
await db.execute(
  sql`INSERT INTO tenants (tenant_id, name, domain) VALUES ('default', 'Default Tenant', 'localhost') ON CONFLICT DO NOTHING`
);
await pool.end();
console.log('migrations applied');
