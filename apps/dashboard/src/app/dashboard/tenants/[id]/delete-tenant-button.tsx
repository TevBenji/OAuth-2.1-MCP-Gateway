'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteTenant } from '../actions';

export function DeleteTenantButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete tenant "${tenantId}"? This removes its OAuth clients and MCP servers. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteTenant(tenantId);
      router.push('/dashboard/tenants');
      router.refresh();
    } catch {
      alert('Failed to delete tenant');
      setDeleting(false);
    }
  };

  return (
    <div className='card-wise border-red-200 p-6'>
      <h2 className='mb-2 text-lg font-bold tracking-tight text-red-700'>Danger Zone</h2>
      <p className='mb-4 text-sm text-wise-gray-500'>
        Deleting a tenant permanently removes all of its clients, servers, and configuration.
      </p>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className='inline-flex h-10 items-center rounded-lg border border-red-600 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50'
      >
        <Trash2 className='mr-2 h-4 w-4' />
        {deleting ? 'Deleting…' : 'Delete Tenant'}
      </button>
    </div>
  );
}
