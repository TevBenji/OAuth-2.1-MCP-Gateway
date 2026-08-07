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
    <div className='card-wise p-6 border border-red-200'>
      <h2 className='text-lg font-semibold text-red-700 mb-2'>Danger Zone</h2>
      <p className='text-sm text-wise-gray-600 mb-4'>
        Deleting a tenant permanently removes all of its clients, servers, and configuration.
      </p>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center disabled:opacity-50'
      >
        <Trash2 className='w-4 h-4 mr-2' />
        {deleting ? 'Deleting…' : 'Delete Tenant'}
      </button>
    </div>
  );
}
