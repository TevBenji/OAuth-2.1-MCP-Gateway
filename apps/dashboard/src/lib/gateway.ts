/**
 * Server-only typed client for the gateway's admin API.
 * The service token never reaches the browser.
 */
import 'server-only';

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:8787';
const ADMIN_TOKEN = process.env.GATEWAY_ADMIN_TOKEN ?? '';

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}/admin/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new GatewayError(res.status, `Gateway ${init?.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Shapes mirror the gateway's admin API responses (drizzle rows)
export interface Tenant {
  tenantId: string;
  name: string;
  domain: string;
  description: string | null;
  complianceTier: string;
  status: 'active' | 'suspended' | 'pending';
  maxUsers: number;
  maxMcpServers: number;
  maxOauthClients: number;
  maxRequestsPerMinute: number;
  maxTokensPerHour: number;
  auditRetentionDays: number;
  enableAuditLogging: boolean;
  enableSessionManagement: boolean;
  enableRateLimiting: boolean;
  allowCustomScopes: boolean;
  requireMfa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthClient {
  clientId: string;
  tenantId: string;
  clientName: string | null;
  clientUri: string | null;
  redirectUris: string[];
  grantTypes: string[];
  scope: string | null;
  tokenEndpointAuthMethod: string;
  clientType: 'public' | 'confidential';
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRegistration {
  client_id: string;
  client_secret?: string;
  redirect_uris: string[];
  grant_types: string[];
  client_name?: string;
  scope?: string;
  token_endpoint_auth_method: string;
}

export interface McpServerEntry {
  server_id: string;
  tenant_id: string;
  config: {
    name: string;
    endpoint_url: string;
    resource_identifier: string;
    required_scopes: string[];
    health_check_url?: string;
    status: 'active' | 'inactive' | 'maintenance';
    timeout_ms: number;
    retry_attempts: number;
  };
  health: { status: 'healthy' | 'unhealthy' | 'unknown'; last_check: string };
  created_at: string;
  updated_at: string;
  access_count: number;
}

export interface AuditLogRow {
  logId: string;
  tenantId: string;
  eventType: string;
  userId: string | null;
  clientId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  action: string;
  outcome: 'success' | 'failure' | 'denied';
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface UsageMetricsRow {
  tenant_id: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
}

export const gateway = {
  tenants: {
    list: () => request<Tenant[]>('/tenants'),
    get: (id: string) => request<Tenant>(`/tenants/${id}`),
    create: (body: {
      tenant_id?: string;
      name: string;
      domain: string;
      description?: string;
    }) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      request<{ success: boolean }>(`/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ success: boolean }>(`/tenants/${id}`, { method: 'DELETE' }),
  },
  clients: {
    list: (tenantId: string) => request<OAuthClient[]>(`/tenants/${tenantId}/clients`),
    create: (tenantId: string, body: unknown) =>
      request<ClientRegistration>(`/tenants/${tenantId}/clients`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    remove: (tenantId: string, clientId: string) =>
      request<{ success: boolean }>(`/tenants/${tenantId}/clients/${clientId}`, {
        method: 'DELETE',
      }),
  },
  servers: {
    list: (tenantId: string) => request<McpServerEntry[]>(`/tenants/${tenantId}/servers`),
    create: (tenantId: string, body: unknown) =>
      request<McpServerEntry>(`/tenants/${tenantId}/servers`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (tenantId: string, serverId: string, body: unknown) =>
      request<McpServerEntry>(`/tenants/${tenantId}/servers/${serverId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    remove: (tenantId: string, serverId: string) =>
      request<{ success: boolean }>(`/tenants/${tenantId}/servers/${serverId}`, {
        method: 'DELETE',
      }),
  },
  auditLogs: {
    list: (params: {
      tenantId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}) => {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) qs.set(key, String(value));
      }
      return request<AuditLogRow[]>(`/audit-logs?${qs.toString()}`);
    },
  },
  usageMetrics: {
    get: (params: { tenantId?: string; startDate?: string; endDate?: string } = {}) => {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) qs.set(key, String(value));
      }
      return request<UsageMetricsRow[]>(`/usage-metrics?${qs.toString()}`);
    },
  },
  rotateApiKeys: (tenantId: string) =>
    request<{ api_key: string; message: string; rotated_at: string }>(
      `/tenants/${tenantId}/rotate-api-keys`,
      { method: 'POST' }
    ),
};
