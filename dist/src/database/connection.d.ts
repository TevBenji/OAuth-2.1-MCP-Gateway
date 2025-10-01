import { D1Database } from '@cloudflare/workers-types';
/**
 * Tenant-aware database connection management
 * Handles connection pooling and tenant context for multi-tenant architecture
 */
export interface DatabaseConfig {
    databaseName: string;
}
export interface TenantContext {
    tenantId: string;
    userId?: string;
    requestId: string;
}
/**
 * DatabaseManager class for handling multi-tenant database operations
 */
export declare class DatabaseManager {
    private database;
    private tenantContext?;
    constructor(database: D1Database);
    /**
     * Sets the tenant context for subsequent database operations
     */
    setTenantContext(context: TenantContext): void;
    /**
     * Gets the current tenant context
     */
    getTenantContext(): TenantContext | undefined;
    /**
     * Gets the underlying database instance
     */
    getDatabase(): D1Database;
    /**
     * Executes a query with tenant isolation
     * Automatically adds tenant filtering to queries where applicable
     */
    executeWithTenant<T>(query: string, params?: any[], tenantId?: string): Promise<T>;
    /**
     * Adds tenant filtering to a SQL query
     * This ensures row-level security by automatically adding tenant_id filters
     */
    private addTenantFilter;
    /**
     * Validates that the provided tenant ID is valid
     */
    validateTenantId(tenantId: string): Promise<boolean>;
    /**
     * Creates a new tenant context for a database transaction
     */
    withTenantContext<T>(tenantId: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Execute a raw SQL query with parameters
     */
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    /**
     * Execute a SQL statement (INSERT, UPDATE, DELETE)
     */
    execute(sql: string, params?: any[]): Promise<{
        rowsAffected: number;
        lastRowId?: number;
    }>;
}
export declare function createDatabaseManager(database: D1Database): DatabaseManager;
