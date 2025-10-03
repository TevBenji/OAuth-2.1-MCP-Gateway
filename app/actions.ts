/**
 * Server Actions for OAuth 2.1 MCP Gateway
 *
 * Next.js App Router server actions using Neon database.
 * These actions are used for admin dashboard and tenant management.
 */

"use server";

import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { randomBytes } from "crypto";

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!);

// ============================================================================
// Validation Schemas
// ============================================================================

const TenantSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/),
  compliance_tier: z.enum(['standard', 'hipaa', 'pci-dss', 'sox']),
  max_users: z.number().int().positive().default(100),
  max_mcp_servers: z.number().int().positive().default(10),
  audit_retention_days: z.number().int().positive().default(365),
});

const OAuthClientSchema = z.object({
  tenant_id: z.string().uuid(),
  client_name: z.string().min(1).max(255),
  redirect_uris: z.array(z.string().url()),
  grant_types: z.array(z.string()).default(['authorization_code', 'refresh_token']),
  response_types: z.array(z.string()).default(['code']),
  scope: z.string().optional(),
  client_type: z.enum(['public', 'confidential']).default('public'),
});

const MCPServerSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  endpoint_url: z.string().url(),
  resource_identifier: z.string().min(1),
  required_scopes: z.array(z.string()).optional(),
  health_check_url: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

// ============================================================================
// Tenant Management Actions
// ============================================================================

export async function getTenants() {
  try {
    const tenants = await sql`
      SELECT
        tenant_id,
        name,
        domain,
        compliance_tier,
        max_users,
        max_mcp_servers,
        audit_retention_days,
        created_at,
        updated_at
      FROM tenants
      ORDER BY created_at DESC
    `;

    return { success: true, data: tenants };
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return { success: false, error: 'Failed to fetch tenants' };
  }
}

export async function getTenant(tenantId: string) {
  try {
    const tenant = await sql`
      SELECT
        tenant_id,
        name,
        domain,
        compliance_tier,
        max_users,
        max_mcp_servers,
        audit_retention_days,
        created_at,
        updated_at
      FROM tenants
      WHERE tenant_id = ${tenantId}
    `;

    if (tenant.length === 0) {
      return { success: false, error: 'Tenant not found' };
    }

    return { success: true, data: tenant[0] };
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    return { success: false, error: 'Failed to fetch tenant' };
  }
}

export async function createTenant(formData: FormData | Record<string, any>) {
  try {
    // Parse form data
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    // Validate input
    const validated = TenantSchema.parse({
      ...data,
      max_users: data.max_users ? Number(data.max_users) : 100,
      max_mcp_servers: data.max_mcp_servers ? Number(data.max_mcp_servers) : 10,
      audit_retention_days: data.audit_retention_days ? Number(data.audit_retention_days) : 365,
    });

    // Create tenant
    const result = await sql`
      INSERT INTO tenants (
        name,
        domain,
        compliance_tier,
        max_users,
        max_mcp_servers,
        audit_retention_days
      ) VALUES (
        ${validated.name},
        ${validated.domain},
        ${validated.compliance_tier},
        ${validated.max_users},
        ${validated.max_mcp_servers},
        ${validated.audit_retention_days}
      )
      RETURNING tenant_id, name, domain, compliance_tier, created_at
    `;

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Failed to create tenant:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create tenant' };
  }
}

export async function updateTenant(tenantId: string, formData: FormData | Record<string, any>) {
  try {
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const validated = TenantSchema.partial().parse({
      ...data,
      max_users: data.max_users ? Number(data.max_users) : undefined,
      max_mcp_servers: data.max_mcp_servers ? Number(data.max_mcp_servers) : undefined,
      audit_retention_days: data.audit_retention_days ? Number(data.audit_retention_days) : undefined,
    });

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (validated.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(validated.name);
    }
    if (validated.compliance_tier) {
      updates.push(`compliance_tier = $${paramIndex++}`);
      values.push(validated.compliance_tier);
    }
    if (validated.max_users) {
      updates.push(`max_users = $${paramIndex++}`);
      values.push(validated.max_users);
    }
    if (validated.max_mcp_servers) {
      updates.push(`max_mcp_servers = $${paramIndex++}`);
      values.push(validated.max_mcp_servers);
    }
    if (validated.audit_retention_days) {
      updates.push(`audit_retention_days = $${paramIndex++}`);
      values.push(validated.audit_retention_days);
    }

    if (updates.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tenantId);

    const query = `
      UPDATE tenants
      SET ${updates.join(', ')}
      WHERE tenant_id = $${paramIndex}
      RETURNING tenant_id, name, domain, compliance_tier, updated_at
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return { success: false, error: 'Tenant not found' };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Failed to update tenant:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update tenant' };
  }
}

// ============================================================================
// OAuth Client Management Actions
// ============================================================================

export async function getOAuthClients(tenantId?: string) {
  try {
    const clients = tenantId
      ? await sql`
          SELECT
            client_id,
            client_name,
            tenant_id,
            redirect_uris,
            grant_types,
            response_types,
            scope,
            client_type,
            token_endpoint_auth_method,
            created_at,
            updated_at
          FROM oauth_clients
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT
            client_id,
            client_name,
            tenant_id,
            redirect_uris,
            grant_types,
            response_types,
            scope,
            client_type,
            token_endpoint_auth_method,
            created_at,
            updated_at
          FROM oauth_clients
          ORDER BY created_at DESC
        `;

    return { success: true, data: clients };
  } catch (error) {
    console.error('Failed to fetch OAuth clients:', error);
    return { success: false, error: 'Failed to fetch OAuth clients' };
  }
}

export async function createOAuthClient(formData: FormData | Record<string, any>) {
  try {
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    // Parse JSON arrays if they're strings
    const parsedData = {
      ...data,
      redirect_uris: typeof data.redirect_uris === 'string'
        ? JSON.parse(data.redirect_uris)
        : data.redirect_uris,
      grant_types: data.grant_types
        ? (typeof data.grant_types === 'string' ? JSON.parse(data.grant_types) : data.grant_types)
        : ['authorization_code', 'refresh_token'],
      response_types: data.response_types
        ? (typeof data.response_types === 'string' ? JSON.parse(data.response_types) : data.response_types)
        : ['code'],
    };

    const validated = OAuthClientSchema.parse(parsedData);

    // Generate client secret for confidential clients
    const clientSecret = validated.client_type === 'confidential'
      ? randomBytes(32).toString('base64')
      : null;

    const result = await sql`
      INSERT INTO oauth_clients (
        tenant_id,
        client_name,
        client_secret,
        redirect_uris,
        grant_types,
        response_types,
        scope,
        client_type,
        token_endpoint_auth_method,
        client_id_issued_at
      ) VALUES (
        ${validated.tenant_id},
        ${validated.client_name},
        ${clientSecret},
        ${JSON.stringify(validated.redirect_uris)},
        ${JSON.stringify(validated.grant_types)},
        ${JSON.stringify(validated.response_types)},
        ${validated.scope || null},
        ${validated.client_type},
        ${validated.client_type === 'public' ? 'none' : 'client_secret_post'},
        ${Math.floor(Date.now() / 1000)}
      )
      RETURNING
        client_id,
        client_name,
        client_secret,
        tenant_id,
        redirect_uris,
        client_type,
        created_at
    `;

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Failed to create OAuth client:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create OAuth client' };
  }
}

// ============================================================================
// MCP Server Management Actions
// ============================================================================

export async function getMCPServers(tenantId?: string) {
  try {
    const servers = tenantId
      ? await sql`
          SELECT
            server_id,
            tenant_id,
            name,
            endpoint_url,
            resource_identifier,
            required_scopes,
            health_check_url,
            status,
            created_at,
            updated_at
          FROM mcp_servers
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT
            server_id,
            tenant_id,
            name,
            endpoint_url,
            resource_identifier,
            required_scopes,
            health_check_url,
            status,
            created_at,
            updated_at
          FROM mcp_servers
          ORDER BY created_at DESC
        `;

    return { success: true, data: servers };
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error);
    return { success: false, error: 'Failed to fetch MCP servers' };
  }
}

export async function createMCPServer(formData: FormData | Record<string, any>) {
  try {
    const data = formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

    const parsedData = {
      ...data,
      required_scopes: data.required_scopes
        ? (typeof data.required_scopes === 'string' ? JSON.parse(data.required_scopes) : data.required_scopes)
        : undefined,
    };

    const validated = MCPServerSchema.parse(parsedData);

    const result = await sql`
      INSERT INTO mcp_servers (
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        required_scopes,
        health_check_url,
        status
      ) VALUES (
        ${validated.tenant_id},
        ${validated.name},
        ${validated.endpoint_url},
        ${validated.resource_identifier},
        ${validated.required_scopes ? JSON.stringify(validated.required_scopes) : null},
        ${validated.health_check_url || null},
        ${validated.status}
      )
      RETURNING
        server_id,
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        status,
        created_at
    `;

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Failed to create MCP server:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create MCP server' };
  }
}

export async function updateMCPServerStatus(serverId: string, status: 'active' | 'inactive' | 'maintenance') {
  try {
    const result = await sql`
      UPDATE mcp_servers
      SET
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE server_id = ${serverId}
      RETURNING server_id, name, status, updated_at
    `;

    if (result.length === 0) {
      return { success: false, error: 'MCP server not found' };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Failed to update MCP server status:', error);
    return { success: false, error: 'Failed to update MCP server status' };
  }
}

// ============================================================================
// Analytics and Reporting Actions
// ============================================================================

export async function getUsageStats(tenantId: string, startDate?: string, endDate?: string) {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const stats = await sql`
      SELECT
        action,
        COUNT(*) as count,
        DATE_TRUNC('day', timestamp) as date
      FROM usage_records
      WHERE
        tenant_id = ${tenantId}
        AND timestamp >= ${start}
        AND timestamp <= ${end}
      GROUP BY action, DATE_TRUNC('day', timestamp)
      ORDER BY date DESC, count DESC
    `;

    return { success: true, data: stats };
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    return { success: false, error: 'Failed to fetch usage stats' };
  }
}

export async function getAuditLogs(tenantId: string, limit: number = 100) {
  try {
    const logs = await sql`
      SELECT
        log_id,
        event_type,
        user_id,
        resource_type,
        resource_id,
        action,
        outcome,
        ip_address,
        compliance_tags,
        risk_score,
        metadata,
        created_at
      FROM audit_logs
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return { success: true, data: logs };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}

export async function getTenantDashboard(tenantId: string) {
  try {
    // Get tenant details
    const tenantResult = await getTenant(tenantId);
    if (!tenantResult.success) {
      return tenantResult;
    }

    // Get counts
    const [clientsCount, serversCount, usersCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM oauth_clients WHERE tenant_id = ${tenantId}`,
      sql`SELECT COUNT(*) as count FROM mcp_servers WHERE tenant_id = ${tenantId}`,
      sql`SELECT COUNT(*) as count FROM users WHERE tenant_id = ${tenantId}`,
    ]);

    // Get recent activity
    const recentActivity = await sql`
      SELECT
        event_type,
        action,
        outcome,
        created_at
      FROM audit_logs
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Get usage summary (last 30 days)
    const usageStats = await getUsageStats(tenantId);

    return {
      success: true,
      data: {
        tenant: tenantResult.data,
        counts: {
          oauth_clients: Number(clientsCount[0].count),
          mcp_servers: Number(serversCount[0].count),
          users: Number(usersCount[0].count),
        },
        recent_activity: recentActivity,
        usage_stats: usageStats.data,
      },
    };
  } catch (error) {
    console.error('Failed to fetch tenant dashboard:', error);
    return { success: false, error: 'Failed to fetch tenant dashboard' };
  }
}
