'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Server, Trash2 } from 'lucide-react';
import type { McpServerEntry } from '@/lib/gateway';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Badge } from '@/components/ui/badge';
import { registerServer, deleteServer } from './actions';

const statusVariant = { active: 'success', inactive: 'default', maintenance: 'warning' } as const;

export function ServersTable({ servers }: { servers: McpServerEntry[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      await registerServer({
        name: String(form.get('name') ?? ''),
        endpoint_url: String(form.get('endpoint_url') ?? ''),
        resource_identifier: String(form.get('resource_identifier') ?? ''),
        required_scopes: String(form.get('required_scopes') ?? '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      });
      setShowCreate(false);
      router.refresh();
    } catch {
      setError('Failed to register server. The resource identifier must be unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Remove this MCP server from the gateway?')) return;
    try {
      await deleteServer(serverId);
      router.refresh();
    } catch {
      alert('Failed to delete server');
    }
  };

  const columns: Column<McpServerEntry>[] = [
    {
      key: 'name',
      label: 'Name',
      render: s => <span className='font-medium'>{s.config.name}</span>,
    },
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: s => <code className='text-xs font-mono'>{s.config.endpoint_url}</code>,
    },
    {
      key: 'resource',
      label: 'Resource Identifier',
      render: s => <code className='text-xs font-mono'>{s.config.resource_identifier}</code>,
    },
    {
      key: 'status',
      label: 'Status',
      render: s => (
        <Badge variant={statusVariant[s.config.status] ?? 'default'} size='sm'>
          {s.config.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: s => (
        <button
          onClick={() => handleDelete(s.server_id)}
          className='p-1.5 rounded hover:bg-red-50 text-wise-gray-400 hover:text-red-600'
          aria-label='Delete server'
        >
          <Trash2 className='w-4 h-4' />
        </button>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>MCP Servers</h1>
          <p className='text-wise-gray-600 mt-1'>
            Model Context Protocol servers proxied by the gateway (default tenant)
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className='btn-wise-primary px-4 py-2 inline-flex items-center'
        >
          <Plus className='w-4 h-4 mr-2' />
          Register Server
        </button>
      </div>

      {servers.length === 0 ? (
        <EmptyState
          icon={Server}
          title='No MCP servers registered'
          description='Register an MCP server so the gateway can proxy authenticated requests to it.'
          action={{ label: 'Register Server', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className='card-wise p-6'>
          <DataTable data={servers} columns={columns} />
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title='Register MCP Server' size='lg'>
        <form onSubmit={handleCreate} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>Name</label>
            <input name='name' required className='input-wise w-full' placeholder='Production API Server' />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>Endpoint URL</label>
            <input
              name='endpoint_url'
              type='url'
              required
              className='input-wise w-full'
              placeholder='https://api.example.com/mcp'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
              Resource Identifier
            </label>
            <input
              name='resource_identifier'
              required
              className='input-wise w-full'
              placeholder='https://api.example.com'
            />
            <p className='text-xs text-wise-gray-500 mt-1'>
              Unique RFC 8707 resource identifier for audience-scoped tokens.
            </p>
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
              Required Scopes (comma-separated)
            </label>
            <input
              name='required_scopes'
              className='input-wise w-full'
              placeholder='mcp:tools:read, mcp:resources:read'
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div className='flex justify-end gap-3 pt-2'>
            <button type='button' onClick={() => setShowCreate(false)} className='btn-wise-secondary px-4 py-2'>
              Cancel
            </button>
            <button type='submit' disabled={submitting} className='btn-wise-primary px-4 py-2'>
              {submitting ? 'Registering…' : 'Register Server'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
