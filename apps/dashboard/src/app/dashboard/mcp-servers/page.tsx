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
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>
          Could not load MCP servers from the gateway admin API.
        </p>
      </div>
    );
  }

  return <ServersTable servers={servers} />;
}
