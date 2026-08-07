import { ShieldAlert } from 'lucide-react';
import { gateway, type Tenant } from '@/lib/gateway';
import { TenantSettingsForm } from '@/components/dashboard/TenantSettingsForm';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8787';

const endpoints = [
  { method: 'GET', path: '/.well-known/oauth-authorization-server', description: 'OAuth 2.1 Server Metadata (RFC 8414)' },
  { method: 'GET', path: '/oauth/authorize', description: 'Authorization Endpoint (PKCE required)' },
  { method: 'POST', path: '/oauth/token', description: 'Token Endpoint' },
  { method: 'POST', path: '/oauth/register', description: 'Dynamic Client Registration (RFC 7591)' },
  { method: 'ALL', path: '/mcp/:serverId/*', description: 'MCP Proxy by Server ID (Bearer token required)' },
];

export default async function GatewaySettingsPage() {
  let tenant: Tenant;
  try {
    tenant = await gateway.tenants.get('default');
  } catch {
    return (
      <div className='card-wise p-12 text-center'>
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>
          Could not load the default tenant&apos;s settings from the gateway admin API.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Gateway Settings</h1>
        <p className='text-wise-gray-600 mt-1'>
          Limits and feature toggles for the default tenant
        </p>
      </div>

      <TenantSettingsForm tenant={tenant} />

      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-1'>API Endpoints</h2>
        <p className='text-sm text-wise-gray-600 mb-4'>
          Base URL: <code className='bg-wise-gray-100 px-2 py-0.5 rounded font-mono'>{GATEWAY_URL}</code>
        </p>
        <div className='space-y-3'>
          {endpoints.map(endpoint => (
            <div
              key={endpoint.path}
              className='flex items-center py-3 px-4 bg-wise-gray-50 rounded-lg space-x-3'
            >
              <Badge variant='secondary' size='sm'>
                {endpoint.method}
              </Badge>
              <code className='text-sm font-mono text-wise-gray-800 flex-1'>{endpoint.path}</code>
              <span className='text-sm text-wise-gray-600'>{endpoint.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
