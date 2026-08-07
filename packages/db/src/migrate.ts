/**
 * CLI migration runner.
 * Usage: DATABASE_URL=postgres://... pnpm --filter @oauth-mcp-gateway/db migrate
 */
import { createDb, runMigrations } from './index.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const { db, pool } = createDb(url);
await runMigrations(db);
await pool.end();
console.log('migrations applied');
