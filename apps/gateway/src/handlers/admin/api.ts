/**
 * Admin API — the management surface consumed by the dashboard.
 *
 * Protected by a service token (ADMIN_TOKEN): callers must send
 * `Authorization: Bearer <token>`. In development, if no ADMIN_TOKEN is
 * configured, access is allowed for convenience.
 */
import { Hono } from 'hono';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { apiKeys, auditLogs, oauthClients, tenants } from '@oauth-mcp-gateway/db';
import { Bindings } from '../../types/bindings';
import { ClientService } from '../../services/oauth/client';
import { TenantService } from '../../services/tenant/isolation';
import { PgMcpServerDatabase } from '../../storage/pg-mcp-server-database';

type AdminContext = {
  Bindings: Bindings;
};

const app = new Hono<AdminContext>();

// Service-token authentication for every admin route
app.use('*', async (c, next) => {
  const expected = c.env?.ADMIN_TOKEN;
  if (!expected) {
    if (c.env?.ENVIRONMENT === 'development') {
      return next();
    }
    return c.json({ error: 'Admin API is not configured' }, 503);
  }
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !timingSafeEqual(token, expected)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const TenantBodySchema = z.object({
  tenant_id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  compliance_tier: z.string().default('standard'),
  max_users: z.number().int().positive().default(100),
  max_mcp_servers: z.number().int().positive().default(10),
  audit_retention_days: z.number().int().positive().default(365),
});

const McpServerBodySchema = z.object({
  name: z.string().min(1).max(255),
  endpoint_url: z.string().url(),
  resource_identifier: z.string().min(1),
  required_scopes: z.array(z.string()).default([]),
  health_check_url: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  timeout_ms: z.number().int().positive().default(30000),
  retry_attempts: z.number().int().min(0).max(5).default(3),
});

// ---- Tenants ----

app.get('/tenants', async c => {
  const rows = await c.env.DB.select().from(tenants).orderBy(desc(tenants.createdAt));
  return c.json(rows);
});

app.post('/tenants', async c => {
  const parsed = TenantBodySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  try {
    const service = new TenantService(c.env.DB);
    const tenant = await service.createTenant({
      tenant_id: body.tenant_id ?? crypto.randomUUID(),
      name: body.name,
      domain: body.domain,
      max_users: body.max_users,
      max_mcp_servers: body.max_mcp_servers,
      compliance_tier: body.compliance_tier as never,
      audit_retention_days: body.audit_retention_days,
    });
    return c.json(tenant, 201);
  } catch (error) {
    console.error('Error creating tenant:', error);
    return c.json({ error: 'Failed to create tenant (id or domain may already exist)' }, 409);
  }
});

app.get('/tenants/:id', async c => {
  const [tenant] = await c.env.DB.select()
    .from(tenants)
    .where(eq(tenants.tenantId, c.req.param('id')))
    .limit(1);
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);
  return c.json(tenant);
});

app.put('/tenants/:id', async c => {
  const tenantId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { name, description, compliance_tier, limits, settings } = body as Record<string, any>;

  const set: Partial<typeof tenants.$inferInsert> = {};
  if (typeof name === 'string') set.name = name;
  if (typeof description === 'string') set.description = description;
  if (typeof compliance_tier === 'string') set.complianceTier = compliance_tier;
  if (limits && typeof limits === 'object') {
    if (Number.isInteger(limits.max_users)) set.maxUsers = limits.max_users;
    if (Number.isInteger(limits.max_mcp_servers)) set.maxMcpServers = limits.max_mcp_servers;
    if (Number.isInteger(limits.max_oauth_clients)) set.maxOauthClients = limits.max_oauth_clients;
    if (Number.isInteger(limits.max_requests_per_minute)) {
      set.maxRequestsPerMinute = limits.max_requests_per_minute;
    }
  }
  if (settings && typeof settings === 'object') {
    if (typeof settings.enable_audit_logging === 'boolean') {
      set.enableAuditLogging = settings.enable_audit_logging;
    }
    if (typeof settings.enable_session_management === 'boolean') {
      set.enableSessionManagement = settings.enable_session_management;
    }
    if (typeof settings.enable_rate_limiting === 'boolean') {
      set.enableRateLimiting = settings.enable_rate_limiting;
    }
    if (typeof settings.allow_custom_scopes === 'boolean') {
      set.allowCustomScopes = settings.allow_custom_scopes;
    }
    if (typeof settings.require_mfa === 'boolean') set.requireMfa = settings.require_mfa;
  }

  if (Object.keys(set).length === 0) {
    return c.json({ error: 'No valid fields to update' }, 400);
  }

  const rows = await c.env.DB.update(tenants)
    .set(set)
    .where(eq(tenants.tenantId, tenantId))
    .returning({ tenantId: tenants.tenantId });
  if (rows.length === 0) return c.json({ error: 'Tenant not found' }, 404);
  return c.json({ success: true });
});

app.delete('/tenants/:id', async c => {
  const service = new TenantService(c.env.DB);
  const existing = await service.getTenant(c.req.param('id'));
  if (!existing) return c.json({ error: 'Tenant not found' }, 404);
  await service.deleteTenant(c.req.param('id'));
  return c.json({ success: true });
});

// ---- OAuth clients ----

app.get('/tenants/:id/clients', async c => {
  const rows = await c.env.DB.select()
    .from(oauthClients)
    .where(eq(oauthClients.tenantId, c.req.param('id')))
    .orderBy(desc(oauthClients.createdAt));
  // Never return stored secrets from a list endpoint
  return c.json(rows.map(({ clientSecret: _secret, ...rest }) => rest));
});

app.post('/tenants/:id/clients', async c => {
  const tenantId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return c.json({ error: 'redirect_uris is required' }, 400);
  }
  try {
    const service = new ClientService(c.env.DB);
    const response = await service.registerClient(body, tenantId);
    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating OAuth client:', error);
    return c.json({ error: 'Failed to create OAuth client' }, 500);
  }
});

app.delete('/tenants/:id/clients/:clientId', async c => {
  const service = new ClientService(c.env.DB);
  const deleted = await service.deleteClient(c.req.param('clientId'), c.req.param('id'));
  if (!deleted) return c.json({ error: 'Client not found' }, 404);
  return c.json({ success: true });
});

// ---- MCP servers ----

app.get('/tenants/:id/servers', async c => {
  const db = new PgMcpServerDatabase(c.env.DB);
  return c.json(await db.getServersByTenant(c.req.param('id')));
});

app.post('/tenants/:id/servers', async c => {
  const parsed = McpServerBodySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400);
  }
  try {
    const db = new PgMcpServerDatabase(c.env.DB);
    const entry = await db.createServer({ ...parsed.data, tenant_id: c.req.param('id') });
    return c.json(entry, 201);
  } catch (error) {
    console.error('Error creating MCP server:', error);
    return c.json({ error: 'Failed to create MCP server (resource identifier must be unique)' }, 409);
  }
});

app.put('/tenants/:id/servers/:serverId', async c => {
  const parsed = McpServerBodySchema.partial().safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400);
  }
  try {
    const db = new PgMcpServerDatabase(c.env.DB);
    const entry = await db.updateServer(c.req.param('serverId'), c.req.param('id'), parsed.data);
    return c.json(entry);
  } catch {
    return c.json({ error: 'MCP server not found' }, 404);
  }
});

app.delete('/tenants/:id/servers/:serverId', async c => {
  const db = new PgMcpServerDatabase(c.env.DB);
  const deleted = await db.deleteServer(c.req.param('serverId'), c.req.param('id'));
  if (!deleted) return c.json({ error: 'MCP server not found' }, 404);
  return c.json({ success: true });
});

// ---- Audit logs ----

app.get('/audit-logs', async c => {
  const { action, tenantId, userId, startDate, endDate, limit, offset } = c.req.query();

  const conditions = [eq(auditLogs.tenantId, tenantId || 'default')];
  if (action) conditions.push(sql`${auditLogs.action} ILIKE ${'%' + action + '%'}`);
  if (userId) conditions.push(eq(auditLogs.userId, userId));
  if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate)));

  const rows = await c.env.DB.select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Number(limit) || 100, 500))
    .offset(Number(offset) || 0);
  return c.json(rows);
});

// ---- Usage metrics (derived from audit logs) ----

app.get('/usage-metrics', async c => {
  const { tenantId, startDate, endDate } = c.req.query();

  const conditions = [];
  if (tenantId) conditions.push(eq(auditLogs.tenantId, tenantId));
  if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate)));

  const rows = await c.env.DB.select({
    tenant_id: auditLogs.tenantId,
    total_requests: count(),
    successful_requests: count(sql`CASE WHEN ${auditLogs.outcome} = 'success' THEN 1 END`),
    failed_requests: count(sql`CASE WHEN ${auditLogs.outcome} <> 'success' THEN 1 END`),
  })
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(auditLogs.tenantId);
  return c.json(rows);
});

// ---- API keys ----

app.post('/tenants/:id/rotate-api-keys', async c => {
  const tenantId = c.req.param('id');

  // Retire current active keys
  await c.env.DB.update(apiKeys)
    .set({ status: 'inactive' })
    .where(and(eq(apiKeys.tenantId, tenantId), eq(apiKeys.status, 'active')));

  // Issue a new key; only the hash is stored, the plaintext is returned once
  const plaintext = `mcp_key_${crypto.randomUUID().replace(/-/g, '')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plaintext));
  const keyHash = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const [maxVersionRow] = await c.env.DB.select({
    max: sql<number>`COALESCE(MAX(${apiKeys.keyVersion}), 0)`,
  })
    .from(apiKeys)
    .where(eq(apiKeys.tenantId, tenantId));

  await c.env.DB.insert(apiKeys).values({
    keyHash,
    tenantId,
    keyVersion: (maxVersionRow?.max ?? 0) + 1,
    status: 'active',
  });

  return c.json({
    api_key: plaintext,
    message: 'API key rotated. Store this key now — it will not be shown again.',
    rotated_at: new Date().toISOString(),
  });
});

export default app;
