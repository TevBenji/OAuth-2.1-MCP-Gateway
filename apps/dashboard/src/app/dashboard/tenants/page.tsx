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
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>Could not load tenants from the gateway admin API.</p>
      </div>
    );
  }

  return <TenantsTable tenants={tenants} />;
}
