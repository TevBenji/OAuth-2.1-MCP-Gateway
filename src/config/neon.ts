/**
 * Neon Database Configuration
 *
 * PostgreSQL database configuration for Neon (serverless Postgres).
 * Used as an alternative to Cloudflare D1 for Vercel deployments.
 */

import { neon, neonConfig } from '@neondatabase/serverless';

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

export interface NeonConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeout?: number;
}

export class NeonDatabase {
  private sql: ReturnType<typeof neon>;

  constructor(config: NeonConfig) {
    this.sql = neon(config.connectionString);
  }

  /**
   * Execute a query
   */
  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return await this.sql(query, params);
  }

  /**
   * Execute a single query and return first result
   */
  async queryOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(query, params);
    return results[0] || null;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (sql: ReturnType<typeof neon>) => Promise<T>): Promise<T> {
    return await callback(this.sql);
  }
}

/**
 * Create Neon database instance from environment
 */
export function createNeonDatabase(): NeonDatabase {
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }

  return new NeonDatabase({ connectionString });
}
