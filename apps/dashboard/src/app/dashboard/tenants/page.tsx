import { ShieldAlert } from 'lucide-react';
import { gateway, type Tenant } from '@/lib/gateway';
import { TenantsTable } from './tenants-table';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  let tenants: Tenant[];
  try {
    tenants = await gateway.tenants.list();
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
          Could not load tenants from the gateway admin API.
        </p>
      </div>
    );
  }

  return <TenantsTable tenants={tenants} />;
}
