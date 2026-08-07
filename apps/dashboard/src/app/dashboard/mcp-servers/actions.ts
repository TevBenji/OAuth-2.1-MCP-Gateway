'use server';

import { requireSession } from '@/lib/auth';
import { gateway } from '@/lib/gateway';

export async function registerServer(body: {
  name: string;
  endpoint_url: string;
  resource_identifier: string;
  required_scopes: string[];
}) {
  await requireSession();
  return gateway.servers.create('default', body);
}

export async function deleteServer(serverId: string) {
  await requireSession();
  return gateway.servers.remove('default', serverId);
}
