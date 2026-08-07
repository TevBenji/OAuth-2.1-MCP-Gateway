import { ShieldAlert } from 'lucide-react';
import { gateway, type McpServerEntry } from '@/lib/gateway';
import { ServersTable } from './servers-table';

export const dynamic = 'force-dynamic';

export default async function McpServersPage() {
  let servers: McpServerEntry[];
  try {
    servers = await gateway.servers.list('default');
  } catch {
    return (
      <div className='card-wise p-12 text-center'>
        <span className='mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <ShieldAlert className='h-6 w-6' />
        </span>
        <h2 className='mb-2 text-lg font-bold tracking-tight text-wise-green-forest'>
          Gateway unreachable
        </h2>
        <p className='mx-auto max-w-md text-sm text-wise-gray-500'>
          Could not load MCP servers from the gateway admin API.
        </p>
      </div>
    );
  }

  return <ServersTable servers={servers} />;
}
