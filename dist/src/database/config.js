// Default tenant limits configuration
export const DEFAULT_TENANT_LIMITS = {
    max_clients: 10,
    max_tokens_per_hour: 1000,
    max_requests_per_minute: 100,
    max_mcp_servers: 5,
    max_users: 50,
};
// Default tenant settings
export const DEFAULT_TENANT_SETTINGS = {
    enable_audit_logging: true,
    enable_session_management: true,
    enable_rate_limiting: true,
    allow_custom_scopes: false,
    require_mfa: false,
};
/**
 * Tenant Configuration Service
 * Manages tenant-specific configurations, compliance tiers, and limits
 */
export class TenantConfigService {
    dbManager;
    constructor(dbManager) {
        this.dbManager = dbManager;
    }
    /**
     * Creates a new tenant with default configuration
     */
    async createTenant(tenantId, name, description, complianceTier = 'basic') {
        const now = new Date().toISOString();
        const tenant = {
            id: tenantId,
            name,
            description,
            compliance_tier: complianceTier,
            limits: this.getLimitsForTier(complianceTier),
            settings: DEFAULT_TENANT_SETTINGS,
            status: 'onboarding',
            created_at: now,
            updated_at: now,
        };
        // In a real implementation, this would insert into the database
        // For now we'll just return the tenant config
        return tenant;
    }
    /**
     * Gets tenant configuration by ID
     */
    async getTenantConfig(tenantId) {
        // In a real implementation, this would query the database
        // For now, we'll return a default config
        return {
            id: tenantId,
            name: `Tenant ${tenantId}`,
            description: `Configuration for tenant ${tenantId}`,
            compliance_tier: 'standard',
            limits: DEFAULT_TENANT_LIMITS,
            settings: DEFAULT_TENANT_SETTINGS,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
    /**
     * Updates tenant configuration
     */
    async updateTenantConfig(tenantId, updateData) {
        // Get current config
        const currentConfig = await this.getTenantConfig(tenantId);
        if (!currentConfig) {
            return null;
        }
        // Merge updated data with current config
        const updatedConfig = {
            ...currentConfig,
            ...updateData,
            updated_at: new Date().toISOString(),
            // Ensure nested objects are properly merged
            limits: {
                ...currentConfig.limits,
                ...(updateData.limits || {})
            },
            settings: {
                ...currentConfig.settings,
                ...(updateData.settings || {})
            }
        };
        // In a real implementation, this would update the database
        return updatedConfig;
    }
    /**
     * Changes the compliance tier for a tenant
     */
    async updateComplianceTier(tenantId, tier) {
        const newLimits = this.getLimitsForTier(tier);
        return await this.updateTenantConfig(tenantId, {
            compliance_tier: tier,
            limits: newLimits
        });
    }
    /**
     * Gets the limits for a specific compliance tier
     */
    getLimitsForTier(tier) {
        switch (tier) {
            case 'basic':
                return {
                    max_clients: 5,
                    max_tokens_per_hour: 500,
                    max_requests_per_minute: 50,
                    max_mcp_servers: 3,
                    max_users: 25,
                };
            case 'standard':
                return {
                    max_clients: 25,
                    max_tokens_per_hour: 5000,
                    max_requests_per_minute: 250,
                    max_mcp_servers: 10,
                    max_users: 100,
                };
            case 'enterprise':
                return {
                    max_clients: 100,
                    max_tokens_per_hour: 50000,
                    max_requests_per_minute: 1000,
                    max_mcp_servers: 50,
                    max_users: 1000,
                };
            case 'custom':
                // Custom tier would be configured specifically per tenant
                return DEFAULT_TENANT_LIMITS;
            default:
                return DEFAULT_TENANT_LIMITS;
        }
    }
    /**
     * Checks if tenant has exceeded a specific limit
     */
    async isLimitExceeded(tenantId, limitType) {
        const config = await this.getTenantConfig(tenantId);
        if (!config) {
            return true; // If no config, assume limit exceeded
        }
        // In a real implementation, this would check current usage against the limit
        // For example, if checking max_clients, it would count the number of clients
        // in the database for this tenant and compare it to config.limits.max_clients
        switch (limitType) {
            case 'max_clients':
                // Check actual client count against limit
                // This is a simplified example
                return false; // Placeholder - in real implementation, query would happen here
            case 'max_tokens_per_hour':
                // Check token usage in the last hour
                return false; // Placeholder
            case 'max_requests_per_minute':
                // Check request count in the last minute
                return false; // Placeholder
            case 'max_mcp_servers':
                // Check actual MCP server count
                return false; // Placeholder
            case 'max_users':
                // Check actual user count
                return false; // Placeholder
            default:
                return false;
        }
    }
    /**
     * Gets all active tenants
     */
    async getActiveTenants() {
        // In a real implementation, this would query all active tenants from the database
        // For now, return an empty array
        return [];
    }
    /**
     * Suspends a tenant
     */
    async suspendTenant(tenantId) {
        const result = await this.updateTenantConfig(tenantId, { status: 'suspended' });
        return result !== null;
    }
    /**
     * Activates a tenant
     */
    async activateTenant(tenantId) {
        const result = await this.updateTenantConfig(tenantId, { status: 'active' });
        return result !== null;
    }
}
// Helper function to create a tenant config service instance
export function createTenantConfigService(dbManager) {
    return new TenantConfigService(dbManager);
}
