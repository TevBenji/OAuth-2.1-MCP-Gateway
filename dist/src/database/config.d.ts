import { DatabaseManager } from './connection';
export declare const DEFAULT_TENANT_LIMITS: {
    max_clients: number;
    max_tokens_per_hour: number;
    max_requests_per_minute: number;
    max_mcp_servers: number;
    max_users: number;
};
export declare const DEFAULT_TENANT_SETTINGS: {
    enable_audit_logging: boolean;
    enable_session_management: boolean;
    enable_rate_limiting: boolean;
    allow_custom_scopes: boolean;
    require_mfa: boolean;
};
export type ComplianceTier = 'basic' | 'standard' | 'enterprise' | 'custom';
export interface TenantLimits {
    max_clients: number;
    max_tokens_per_hour: number;
    max_requests_per_minute: number;
    max_mcp_servers: number;
    max_users: number;
}
export interface TenantSettings {
    enable_audit_logging: boolean;
    enable_session_management: boolean;
    enable_rate_limiting: boolean;
    allow_custom_scopes: boolean;
    require_mfa: boolean;
}
export interface TenantConfig {
    id: string;
    name: string;
    description?: string;
    compliance_tier: ComplianceTier;
    limits: TenantLimits;
    status: 'active' | 'suspended' | 'pending' | 'onboarding';
    settings: TenantSettings;
    created_at: string;
    updated_at: string;
}
/**
 * Tenant Configuration Service
 * Manages tenant-specific configurations, compliance tiers, and limits
 */
export declare class TenantConfigService {
    private dbManager;
    constructor(dbManager: DatabaseManager);
    /**
     * Creates a new tenant with default configuration
     */
    createTenant(tenantId: string, name: string, description?: string, complianceTier?: ComplianceTier): Promise<TenantConfig>;
    /**
     * Gets tenant configuration by ID
     */
    getTenantConfig(tenantId: string): Promise<TenantConfig | null>;
    /**
     * Updates tenant configuration
     */
    updateTenantConfig(tenantId: string, updateData: Partial<TenantConfig>): Promise<TenantConfig | null>;
    /**
     * Changes the compliance tier for a tenant
     */
    updateComplianceTier(tenantId: string, tier: ComplianceTier): Promise<TenantConfig | null>;
    /**
     * Gets the limits for a specific compliance tier
     */
    private getLimitsForTier;
    /**
     * Checks if tenant has exceeded a specific limit
     */
    isLimitExceeded(tenantId: string, limitType: keyof TenantLimits): Promise<boolean>;
    /**
     * Gets all active tenants
     */
    getActiveTenants(): Promise<TenantConfig[]>;
    /**
     * Suspends a tenant
     */
    suspendTenant(tenantId: string): Promise<boolean>;
    /**
     * Activates a tenant
     */
    activateTenant(tenantId: string): Promise<boolean>;
}
export declare function createTenantConfigService(dbManager: DatabaseManager): TenantConfigService;
