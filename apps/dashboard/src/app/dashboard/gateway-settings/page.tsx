import { ShieldAlert } from 'lucide-react';
import { gateway, type Tenant } from '@/lib/gateway';
import { TenantSettingsForm } from '@/components/dashboard/TenantSettingsForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
        <span className='mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <ShieldAlert className='h-6 w-6' />
        </span>
        <h2 className='mb-2 text-lg font-bold tracking-tight text-wise-green-forest'>
          Gateway unreachable
        </h2>
        <p className='mx-auto max-w-md text-sm text-wise-gray-500'>
          Could not load the default tenant&apos;s settings from the gateway admin API.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Configuration'
        title='Gateway Settings'
        description='Limits and feature toggles for the default tenant'
      />

      <TenantSettingsForm tenant={tenant} />

      <div className='card-wise p-6'>
        <h2 className='mb-1 text-lg font-bold tracking-tight text-wise-green-forest'>
          API Endpoints
        </h2>
        <p className='mb-4 text-sm text-wise-gray-500'>
          Base URL:{' '}
          <code className='rounded bg-wise-gray-100 px-2 py-0.5 font-mono'>{GATEWAY_URL}</code>
        </p>
        <div className='space-y-3'>
          {endpoints.map(endpoint => (
            <div
              key={endpoint.path}
              className='flex items-center gap-3 rounded-lg border border-wise-gray-200 bg-wise-gray-50 px-4 py-3'
            >
              <Badge variant='secondary' size='sm'>
                {endpoint.method}
              </Badge>
              <code className='flex-1 font-mono text-sm text-wise-gray-800'>{endpoint.path}</code>
              <span className='text-sm text-wise-gray-500'>{endpoint.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
