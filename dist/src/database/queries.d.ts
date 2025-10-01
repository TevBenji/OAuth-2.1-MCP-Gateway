import { D1Database } from '@cloudflare/workers-types';
/**
 * TenantIsolationService ensures proper isolation between tenants
 * Implements row-level security policies for multi-tenant architecture
 */
export declare class TenantIsolationService {
    private db;
    constructor(db: D1Database);
    /**
     * Executes a tenant-aware query ensuring proper isolation
     */
    executeTenantQuery<T>(query: string, params: any[], tenantId: string): Promise<T>;
    /**
     * Checks if a tenant has access to a specific resource
     */
    hasResourceAccess(tenantId: string, resourceType: string, resourceId: string): Promise<boolean>;
    /**
     * Ensures tenant isolation by modifying the query to include tenant filters
     */
    private ensureTenantIsolation;
    /**
     * Checks if a query already has a tenant filter
     */
    private hasTenantFilter;
    /**
     * Adds a tenant filter to a query
     */
    private addTenantFilter;
    /**
     * Validates cross-tenant access attempts
     */
    validateCrossTenantAccess(sourceTenantId: string, targetTenantId: string): Promise<boolean>;
    /**
     * Gets tenant-specific statistics
     */
    getTenantStats(tenantId: string): Promise<{
        tenantId: string;
        clientCount: any;
        userCount: any;
        tokenCount: any;
        serverCount: any;
    }>;
}
/**
 * Query builder for tenant-aware operations
 */
export declare class TenantQueryBuilder {
    private tenantId;
    private baseQuery;
    private params;
    private hasWhere;
    constructor(tenantId: string);
    select(fields?: string): TenantQueryBuilder;
    from(table: string): TenantQueryBuilder;
    where(condition: string, ...params: any[]): TenantQueryBuilder;
    andWhere(condition: string, ...params: any[]): TenantQueryBuilder;
    orWhere(condition: string, ...params: any[]): TenantQueryBuilder;
    orderBy(field: string, direction?: 'ASC' | 'DESC'): TenantQueryBuilder;
    limit(count: number): TenantQueryBuilder;
    addTenantFilter(): TenantQueryBuilder;
    build(): {
        query: string;
        params: any[];
    };
}
