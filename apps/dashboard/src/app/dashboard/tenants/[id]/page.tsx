import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { gateway, GatewayError, type OAuthClient, type Tenant } from '@/lib/gateway';
import { Badge } from '@/components/ui/badge';
import { TenantSettingsForm } from '@/components/dashboard/TenantSettingsForm';
import { ClientsCard } from './clients-card';
import { DeleteTenantButton } from './delete-tenant-button';

export const dynamic = 'force-dynamic';

const statusVariant = { active: 'success', suspended: 'default', pending: 'warning' } as const;

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
        <span className='mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <ShieldAlert className='h-6 w-6' />
        </span>
        <h2 className='mb-2 text-lg font-bold tracking-tight text-wise-green-forest'>
          Gateway unreachable
        </h2>
        <p className='mx-auto max-w-md text-sm text-wise-gray-500'>
          Could not load this tenant from the gateway admin API.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <Link
          href='/dashboard/tenants'
          className='mb-3 inline-flex items-center text-sm font-medium text-wise-gray-500 transition hover:text-wise-green-forest'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Tenants
        </Link>
        <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
          Tenant
        </p>
        <div className='mt-1 flex items-center gap-3'>
          <h1 className='text-2xl font-extrabold tracking-tight text-wise-green-forest sm:text-3xl'>
            {tenant.name}
          </h1>
          <Badge variant={statusVariant[tenant.status] ?? 'default'}>{tenant.status}</Badge>
        </div>
      </div>

      <div className='card-wise p-6'>
        <h2 className='mb-4 text-lg font-bold tracking-tight text-wise-green-forest'>
          Tenant Info
        </h2>
        <dl className='grid grid-cols-1 gap-x-8 gap-y-4 text-sm md:grid-cols-2'>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Tenant ID
            </dt>
            <dd className='mt-0.5 font-mono text-wise-gray-900'>{tenant.tenantId}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Domain
            </dt>
            <dd className='mt-0.5 text-wise-gray-900'>{tenant.domain}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Compliance Tier
            </dt>
            <dd className='mt-0.5 text-wise-gray-900'>{tenant.complianceTier}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Created
            </dt>
            <dd className='mt-0.5 text-wise-gray-900'>
              {new Date(tenant.createdAt).toLocaleString()}
            </dd>
          </div>
          {tenant.description && (
            <div className='md:col-span-2'>
              <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
                Description
              </dt>
              <dd className='mt-0.5 text-wise-gray-900'>{tenant.description}</dd>
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
