import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { gateway, GatewayError, type OAuthClient, type Tenant } from '@/lib/gateway';
import { Badge } from '@/components/ui/badge';
import { TenantSettingsForm } from '@/components/dashboard/TenantSettingsForm';
import { ClientsCard } from './clients-card';
import { DeleteTenantButton } from './delete-tenant-button';

export const dynamic = 'force-dynamic';

const statusVariant = { active: 'success', suspended: 'danger', pending: 'warning' } as const;

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tenant: Tenant;
  let clients: OAuthClient[];
  try {
    [tenant, clients] = await Promise.all([gateway.tenants.get(id), gateway.clients.list(id)]);
  } catch (error) {
    if (error instanceof GatewayError && error.status === 404) notFound();
    return (
      <div className='card-wise p-12 text-center'>
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>Could not load this tenant from the gateway admin API.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <Link
          href='/dashboard/tenants'
          className='inline-flex items-center text-sm text-wise-gray-600 hover:text-wise-gray-900 mb-2'
        >
          <ArrowLeft className='w-4 h-4 mr-1' />
          Back to Tenants
        </Link>
        <div className='flex items-center gap-3'>
          <h1 className='text-3xl font-bold text-wise-gray-900'>{tenant.name}</h1>
          <Badge variant={statusVariant[tenant.status] ?? 'default'}>{tenant.status}</Badge>
        </div>
      </div>

      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>Tenant Info</h2>
        <dl className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm'>
          <div>
            <dt className='text-wise-gray-600'>Tenant ID</dt>
            <dd className='font-mono text-wise-gray-900 mt-0.5'>{tenant.tenantId}</dd>
          </div>
          <div>
            <dt className='text-wise-gray-600'>Domain</dt>
            <dd className='text-wise-gray-900 mt-0.5'>{tenant.domain}</dd>
          </div>
          <div>
            <dt className='text-wise-gray-600'>Compliance Tier</dt>
            <dd className='text-wise-gray-900 mt-0.5'>{tenant.complianceTier}</dd>
          </div>
          <div>
            <dt className='text-wise-gray-600'>Created</dt>
            <dd className='text-wise-gray-900 mt-0.5'>
              {new Date(tenant.createdAt).toLocaleString()}
            </dd>
          </div>
          {tenant.description && (
            <div className='md:col-span-2'>
              <dt className='text-wise-gray-600'>Description</dt>
              <dd className='text-wise-gray-900 mt-0.5'>{tenant.description}</dd>
            </div>
          )}
        </dl>
      </div>

      <TenantSettingsForm tenant={tenant} />

      <ClientsCard tenantId={tenant.tenantId} clients={clients} />

      <DeleteTenantButton tenantId={tenant.tenantId} />
    </div>
  );
}
