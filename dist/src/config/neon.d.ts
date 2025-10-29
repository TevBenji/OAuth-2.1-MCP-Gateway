/**
 * Neon Database Configuration
 *
 * PostgreSQL database configuration for Neon (serverless Postgres).
 * Used as an alternative to Cloudflare D1 for Vercel deployments.
 */
import { neon } from '@neondatabase/serverless';
export interface NeonConfig {
    connectionString: string;
    maxConnections?: number;
    idleTimeout?: number;
}
export declare class NeonDatabase {
    private sql;
    constructor(config: NeonConfig);
    /**
     * Execute a query
     */
    query<T = any>(query: string, params?: any[]): Promise<T[]>;
    /**
     * Execute a single query and return first result
     */
    queryOne<T = any>(query: string, params?: any[]): Promise<T | null>;
    /**
     * Execute a transaction
     */
    transaction<T>(callback: (sql: ReturnType<typeof neon>) => Promise<T>): Promise<T>;
}
/**
 * Create Neon database instance from environment
 */
export declare function createNeonDatabase(): NeonDatabase;
