'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus } from 'lucide-react';
import type { Tenant } from '@/lib/gateway';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Badge } from '@/components/ui/badge';
import { createTenant } from './actions';

const statusVariant = { active: 'success', suspended: 'danger', pending: 'warning' } as const;

export function TenantsTable({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: t => (
        <Link
          href={`/dashboard/tenants/${t.tenantId}`}
          className='font-medium text-wise-green-primary hover:text-wise-green-600'
        >
          {t.name}
        </Link>
      ),
    },
    { key: 'domain', label: 'Domain', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: t => (
        <Badge variant={statusVariant[t.status] ?? 'default'} size='sm'>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: t => new Date(t.createdAt).toLocaleDateString(),
    },
  ];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await createTenant({
        name: String(form.get('name') ?? ''),
        domain: String(form.get('domain') ?? ''),
        description: String(form.get('description') ?? '') || undefined,
      });
      setShowCreate(false);
      router.refresh();
    } catch {
      setError('Failed to create tenant. The domain may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Tenants</h1>
          <p className='text-wise-gray-600 mt-1'>Isolated tenants served by this gateway</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className='btn-wise-primary px-4 py-2 inline-flex items-center'
        >
          <Plus className='w-4 h-4 mr-2' />
          New Tenant
        </button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title='No tenants yet'
          description='Create your first tenant to start registering OAuth clients and MCP servers.'
          action={{ label: 'Create Tenant', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className='card-wise p-6'>
          <DataTable data={tenants} columns={columns} />
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title='Create Tenant'>
        <form onSubmit={handleCreate} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>Name</label>
            <input name='name' required className='input-wise w-full' placeholder='Acme Corp' />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>Domain</label>
            <input name='domain' required className='input-wise w-full' placeholder='acme.example.com' />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
              Description (optional)
            </label>
            <textarea name='description' rows={3} className='input-wise w-full' />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div className='flex justify-end gap-3 pt-2'>
            <button
              type='button'
              onClick={() => setShowCreate(false)}
              className='btn-wise-secondary px-4 py-2'
            >
              Cancel
            </button>
            <button type='submit' disabled={submitting} className='btn-wise-primary px-4 py-2'>
              {submitting ? 'Creating…' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
