import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export * from './schema.js';
export { schema };

export type Db = NodePgDatabase<typeof schema>;

/** Create a Drizzle client backed by a pg Pool. */
export function createDb(connectionString: string): { db: Db; pool: pg.Pool } {
  const pool = new pg.Pool({ connectionString });
  return { db: drizzle(pool, { schema, casing: 'snake_case' }), pool };
}
