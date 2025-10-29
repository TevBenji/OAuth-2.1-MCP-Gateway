/**
 * Tenant Isolation Service
 *
 * Manages tenant creation, configuration, and data isolation.
 * Requirements: 3.1, 3.2, 4.4
 */
export interface TenantConfig {
    tenant_id: string;
    name: string;
    domain: string;
    max_users: number;
    max_mcp_servers: number;
    compliance_tier: 'standard' | 'enterprise' | 'hipaa' | 'pci-dss';
    audit_retention_days: number;
    created_at?: string;
    updated_at?: string;
}
export declare class TenantService {
    private db;
    constructor(db: D1Database);
    /**
     * Create a new tenant
     */
    createTenant(config: TenantConfig): Promise<TenantConfig>;
    /**
     * Get tenant by ID
     */
    getTenant(tenant_id: string): Promise<TenantConfig | null>;
    /**
     * Update tenant configuration
     */
    updateTenant(tenant_id: string, updates: Partial<TenantConfig>): Promise<void>;
    /**
     * Delete tenant (soft delete by marking as inactive)
     */
    deleteTenant(tenant_id: string): Promise<void>;
    /**
     * Verify tenant isolation for database queries
     */
    verifyTenantIsolation(tenant_id: string, resource_tenant_id: string): Promise<boolean>;
}
