'use server';

import { requireSession } from '@/lib/auth';
import { gateway, type ClientRegistration } from '@/lib/gateway';

export async function createTenant(body: { name: string; domain: string; description?: string }) {
  await requireSession();
  return gateway.tenants.create(body);
}

export async function updateTenant(
  tenantId: string,
  body: {
    name?: string;
    description?: string;
    limits?: {
      max_users?: number;
      max_mcp_servers?: number;
      max_oauth_clients?: number;
      max_requests_per_minute?: number;
    };
    settings?: {
      enable_audit_logging?: boolean;
      enable_session_management?: boolean;
      enable_rate_limiting?: boolean;
      allow_custom_scopes?: boolean;
      require_mfa?: boolean;
    };
  }
) {
  await requireSession();
  return gateway.tenants.update(tenantId, body);
}

export async function deleteTenant(tenantId: string) {
  await requireSession();
  return gateway.tenants.remove(tenantId);
}

export async function createClient(
  tenantId: string,
  body: {
    client_name: string;
    redirect_uris: string[];
    token_endpoint_auth_method: string;
  }
): Promise<ClientRegistration> {
  await requireSession();
  return gateway.clients.create(tenantId, body);
}

export async function deleteClient(tenantId: string, clientId: string) {
  await requireSession();
  return gateway.clients.remove(tenantId, clientId);
}
