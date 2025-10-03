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

export class TenantService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Create a new tenant
   */
  async createTenant(config: TenantConfig): Promise<TenantConfig> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO tenants (
          tenant_id, name, domain, max_users, max_mcp_servers,
          compliance_tier, audit_retention_days, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        config.tenant_id,
        config.name,
        config.domain,
        config.max_users,
        config.max_mcp_servers,
        config.compliance_tier,
        config.audit_retention_days,
        now,
        now
      )
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
  async getTenant(tenant_id: string): Promise<TenantConfig | null> {
    const result = await this.db
      .prepare('SELECT * FROM tenants WHERE tenant_id = ?')
      .bind(tenant_id)
      .first<TenantConfig>();

    return result;
  }

  /**
   * Update tenant configuration
   */
  async updateTenant(tenant_id: string, updates: Partial<TenantConfig>): Promise<void> {
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(k => k !== 'tenant_id');
    const values = fields.map(k => (updates as any)[k]);

    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db
      .prepare(`UPDATE tenants SET ${setClause}, updated_at = ? WHERE tenant_id = ?`)
      .bind(...values, now, tenant_id)
      .run();
  }

  /**
   * Delete tenant (soft delete by marking as inactive)
   */
  async deleteTenant(tenant_id: string): Promise<void> {
    await this.db
      .prepare('UPDATE tenants SET active = 0, updated_at = ? WHERE tenant_id = ?')
      .bind(new Date().toISOString(), tenant_id)
      .run();
  }

  /**
   * Verify tenant isolation for database queries
   */
  async verifyTenantIsolation(tenant_id: string, resource_tenant_id: string): Promise<boolean> {
    return tenant_id === resource_tenant_id;
  }
}
