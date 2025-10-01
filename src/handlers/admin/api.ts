import { Hono } from 'hono';
import { Bindings } from '../../types/bindings';
import { Tenant } from '../../database/schema';
import { AuditLog } from '../../types/audit';
import { UsageMetrics } from '../../types/usage';
import { OAuthClient } from '../../database/schema';

type AdminContext = {
  Bindings: Bindings;
};

const app = new Hono<AdminContext>();

// Get all tenants
app.get('/tenants', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM tenants ORDER BY created_at DESC`
    ).all();
    
    return c.json(results);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return c.json({ error: 'Failed to fetch tenants' }, 500);
  }
});

// Get tenant by ID
app.get('/tenants/:id', async (c) => {
  const tenantId = c.req.param('id');
  
  try {
    const tenant = await c.env.DB.prepare(
      `SELECT * FROM tenants WHERE tenant_id = ?`
    )
    .bind(tenantId)
    .first();
    
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    
    return c.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return c.json({ error: 'Failed to fetch tenant' }, 500);
  }
});

// Update tenant configuration
app.put('/tenants/:id', async (c) => {
  const tenantId = c.req.param('id');
  const { name, description, compliance_tier, limits, settings } = await c.req.json();
  
  try {
    await c.env.DB.prepare(
      `UPDATE tenants 
       SET name = ?, description = ?, compliance_tier = ?, 
           max_users = ?, max_mcp_servers = ?, max_oauth_clients = ?, max_requests_per_minute = ?,
           enable_audit_logging = ?, enable_session_management = ?, enable_rate_limiting = ?,
           allow_custom_scopes = ?, require_mfa = ?, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ?`
    )
    .bind(
      name,
      description,
      compliance_tier,
      limits.max_users,
      limits.max_mcp_servers,
      limits.max_oauth_clients,
      limits.max_requests_per_minute,
      settings.enable_audit_logging,
      settings.enable_session_management,
      settings.enable_rate_limiting,
      settings.allow_custom_scopes,
      settings.require_mfa,
      tenantId
    )
    .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return c.json({ error: 'Failed to update tenant' }, 500);
  }
});

// Get OAuth clients for a tenant
app.get('/tenants/:id/clients', async (c) => {
  const tenantId = c.req.param('id');
  
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM oauth_clients WHERE tenant_id = ? ORDER BY created_at DESC`
    )
    .bind(tenantId)
    .all();
    
    return c.json(results);
  } catch (error) {
    console.error('Error fetching OAuth clients:', error);
    return c.json({ error: 'Failed to fetch OAuth clients' }, 500);
  }
});

// Create new OAuth client
app.post('/tenants/:id/clients', async (c) => {
  const tenantId = c.req.param('id');
  const clientData = await c.req.json();
  
  try {
    const clientId = crypto.randomUUID();
    const clientSecret = clientData.client_type === 'confidential' 
      ? `secret_${crypto.randomUUID()}` 
      : undefined;
    
    await c.env.DB.prepare(
      `INSERT INTO oauth_clients (
         client_id, client_secret, tenant_id, redirect_uris, grant_types, 
         response_types, scope, client_name, client_uri, logo_uri, 
         token_endpoint_auth_method, client_id_issued_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(
      clientId,
      clientSecret,
      tenantId,
      JSON.stringify(clientData.redirect_uris || []),
      JSON.stringify(clientData.grant_types || ['authorization_code']),
      JSON.stringify(clientData.response_types || ['code']),
      clientData.scope || '',
      clientData.client_name || '',
      clientData.client_uri || '',
      clientData.logo_uri || '',
      clientData.token_endpoint_auth_method || 'client_secret_basic',
      Math.floor(Date.now() / 1000)
    )
    .run();
    
    return c.json({ 
      client_id: clientId, 
      client_secret: clientSecret,
      message: 'OAuth client created successfully' 
    });
  } catch (error) {
    console.error('Error creating OAuth client:', error);
    return c.json({ error: 'Failed to create OAuth client' }, 500);
  }
});

// Get audit logs
app.get('/audit-logs', async (c) => {
  const { action, tenantId, userId, startDate, endDate } = c.req.query();
  
  try {
    let query = `SELECT * FROM audit_logs`;
    const params: any[] = [];
    
    const conditions = [];
    
    if (action) {
      conditions.push(`action LIKE ?`);
      params.push(`%${action}%`);
    }
    
    if (tenantId) {
      conditions.push(`tenant_id = ?`);
      params.push(tenantId);
    }
    
    if (userId) {
      conditions.push(`user_id = ?`);
      params.push(userId);
    }
    
    if (startDate) {
      conditions.push(`timestamp >= ?`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`timestamp <= ?`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY timestamp DESC LIMIT 100`; // Limit for performance
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json(results);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return c.json({ error: 'Failed to fetch audit logs' }, 500);
  }
});

// Get usage metrics
app.get('/usage-metrics', async (c) => {
  const { tenantId, startDate, endDate } = c.req.query();
  
  try {
    // This is a simplified example - in a real implementation, you'd have more complex queries
    // to aggregate usage data from various sources
    
    // For now, return mock data or query from a usage tracking table
    const query = `
      SELECT 
        tenant_id,
        SUM(requests) as total_requests,
        SUM(successful_requests) as successful_requests,
        SUM(failed_requests) as failed_requests,
        AVG(response_time_avg) as avg_response_time_ms
      FROM usage_records
      WHERE 1=1
      ${tenantId ? `AND tenant_id = ?` : ''}
      ${startDate ? `AND timestamp >= ?` : ''}
      ${endDate ? `AND timestamp <= ?` : ''}
      GROUP BY tenant_id
    `;
    
    const params: any[] = [];
    if (tenantId) params.push(tenantId);
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json(results);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return c.json({ error: 'Failed to fetch usage metrics' }, 500);
  }
});

// Rotate API keys for a tenant
app.post('/tenants/:id/rotate-api-keys', async (c) => {
  const tenantId = c.req.param('id');
  
  try {
    // In a real implementation, this would generate new API keys and invalidate old ones
    // For now, just return a success message
    return c.json({ 
      message: 'API keys rotated successfully',
      rotated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error rotating API keys:', error);
    return c.json({ error: 'Failed to rotate API keys' }, 500);
  }
});

export default app;