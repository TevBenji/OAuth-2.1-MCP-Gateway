/**
 * Tenant Isolation Service
 *
 * Manages tenant creation, configuration, and data isolation.
 * Requirements: 3.1, 3.2, 4.4
 */
export class TenantService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Create a new tenant
     */
    async createTenant(config) {
        const now = new Date().toISOString();
        await this.db
            .prepare(`INSERT INTO tenants (
          tenant_id, name, domain, max_users, max_mcp_servers,
          compliance_tier, audit_retention_days, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(config.tenant_id, config.name, config.domain, config.max_users, config.max_mcp_servers, config.compliance_tier, config.audit_retention_days, now, now)
            .run();
        return {
            ...config,
            created_at: now,
            updated_at: now
        };
    }
    /**
     * Get tenant by ID
     */
    async getTenant(tenant_id) {
        const result = await this.db
            .prepare('SELECT * FROM tenants WHERE tenant_id = ?')
            .bind(tenant_id)
            .first();
        return result;
    }
    /**
     * Update tenant configuration
     */
    async updateTenant(tenant_id, updates) {
        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter(k => k !== 'tenant_id');
        const values = fields.map(k => updates[k]);
        if (fields.length === 0)
            return;
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        await this.db
            .prepare(`UPDATE tenants SET ${setClause}, updated_at = ? WHERE tenant_id = ?`)
            .bind(...values, now, tenant_id)
            .run();
    }
    /**
     * Delete tenant (soft delete by marking as inactive)
     */
    async deleteTenant(tenant_id) {
        await this.db
            .prepare('UPDATE tenants SET active = 0, updated_at = ? WHERE tenant_id = ?')
            .bind(new Date().toISOString(), tenant_id)
            .run();
    }
    /**
     * Verify tenant isolation for database queries
     */
    async verifyTenantIsolation(tenant_id, resource_tenant_id) {
        return tenant_id === resource_tenant_id;
    }
}
