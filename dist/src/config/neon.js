/**
 * Neon Database Configuration
 *
 * PostgreSQL database configuration for Neon (serverless Postgres).
 * Used as an alternative to Cloudflare D1 for Vercel deployments.
 */
import { neon, neonConfig } from '@neondatabase/serverless';
// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;
export class NeonDatabase {
    sql;
    constructor(config) {
        this.sql = neon(config.connectionString);
    }
    /**
     * Execute a query
     */
    async query(query, params = []) {
        return await this.sql(query, params);
    }
    /**
     * Execute a single query and return first result
     */
    async queryOne(query, params = []) {
        const results = await this.query(query, params);
        return results[0] || null;
    }
    /**
     * Execute a transaction
     */
    async transaction(callback) {
        return await callback(this.sql);
    }
}
/**
 * Create Neon database instance from environment
 */
export function createNeonDatabase() {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
    }
    return new NeonDatabase({ connectionString });
}
