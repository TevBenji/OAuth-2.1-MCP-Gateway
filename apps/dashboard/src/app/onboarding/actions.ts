'use server';

import { requireSession } from '@/lib/auth';
import { gateway, type ClientRegistration } from '@/lib/gateway';

export async function registerOnboardingClient(body: {
  client_name: string;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
}): Promise<ClientRegistration> {
  await requireSession();
  return gateway.clients.create('default', body);
}

export async function registerOnboardingServers(
  servers: { name: string; endpoint: string }[]
) {
  await requireSession();
  for (const server of servers) {
    await gateway.servers.create('default', {
      name: server.name,
      endpoint_url: server.endpoint,
      // ponytail: endpoint URL doubles as the RFC 8707 resource identifier;
      // edit it later from the MCP Servers page if a distinct one is needed
      resource_identifier: server.endpoint,
      required_scopes: [],
    });
  }
}
