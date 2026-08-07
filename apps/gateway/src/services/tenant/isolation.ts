/**
 * Tenant Isolation Service
 *
 * Manages tenant creation, configuration, and data isolation.
 */
import { eq } from 'drizzle-orm';
import { tenants, type Db } from '@oauth-mcp-gateway/db';

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
  constructor(private db: Db) {}

  /**
   * Create a new tenant
   */
  async createTenant(config: TenantConfig): Promise<TenantConfig> {
    const [row] = await this.db
      .insert(tenants)
      .values({
        tenantId: config.tenant_id,
        name: config.name,
        domain: config.domain,
        maxUsers: config.max_users,
        maxMcpServers: config.max_mcp_servers,
        complianceTier: config.compliance_tier,
        auditRetentionDays: config.audit_retention_days,
      })
      .returning();

    return this.toConfig(row!);
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenant_id: string): Promise<TenantConfig | null> {
    const [row] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.tenantId, tenant_id))
      .limit(1);
    return row ? this.toConfig(row) : null;
  }

  /**
   * Update tenant configuration (only known fields are written)
   */
  async updateTenant(tenant_id: string, updates: Partial<TenantConfig>): Promise<void> {
    const set: Partial<typeof tenants.$inferInsert> = {};
    if (updates.name !== undefined) set.name = updates.name;
    if (updates.domain !== undefined) set.domain = updates.domain;
    if (updates.max_users !== undefined) set.maxUsers = updates.max_users;
    if (updates.max_mcp_servers !== undefined) set.maxMcpServers = updates.max_mcp_servers;
    if (updates.compliance_tier !== undefined) set.complianceTier = updates.compliance_tier;
    if (updates.audit_retention_days !== undefined) {
      set.auditRetentionDays = updates.audit_retention_days;
    }
    if (Object.keys(set).length === 0) return;

    await this.db.update(tenants).set(set).where(eq(tenants.tenantId, tenant_id));
  }

  /**
   * Delete tenant (soft delete by suspending it)
   */
  async deleteTenant(tenant_id: string): Promise<void> {
    await this.db
      .update(tenants)
      .set({ status: 'suspended' })
      .where(eq(tenants.tenantId, tenant_id));
  }

  /**
   * Verify tenant isolation for database queries
   */
  async verifyTenantIsolation(tenant_id: string, resource_tenant_id: string): Promise<boolean> {
    return tenant_id === resource_tenant_id;
  }

  private toConfig(row: typeof tenants.$inferSelect): TenantConfig {
    return {
      tenant_id: row.tenantId,
      name: row.name,
      domain: row.domain,
      max_users: row.maxUsers,
      max_mcp_servers: row.maxMcpServers,
      compliance_tier: row.complianceTier as TenantConfig['compliance_tier'],
      audit_retention_days: row.auditRetentionDays,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    };
  }
}
