'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import type { OAuthClient, ClientRegistration } from '@/lib/gateway';
import { DataTable, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/dashboard/Modal';
import { Badge } from '@/components/ui/badge';
import { createClient, deleteClient } from '../actions';

export function ClientsCard({
  tenantId,
  clients,
}: {
  tenantId: string;
  clients: OAuthClient[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ClientRegistration | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, item: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(item);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const redirectUris = String(form.get('redirect_uris') ?? '')
      .split('\n')
      .map(uri => uri.trim())
      .filter(Boolean);
    if (redirectUris.length === 0) {
      setError('At least one redirect URI is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createClient(tenantId, {
        client_name: String(form.get('client_name') ?? ''),
        redirect_uris: redirectUris,
        token_endpoint_auth_method: String(form.get('token_endpoint_auth_method') ?? 'client_secret_basic'),
      });
      setShowCreate(false);
      setRegistration(result);
      router.refresh();
    } catch {
      setError('Failed to register client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Delete this OAuth client? Applications using it will lose access.')) return;
    try {
      await deleteClient(tenantId, clientId);
      router.refresh();
    } catch {
      alert('Failed to delete client');
    }
  };

  const columns: Column<OAuthClient>[] = [
    {
      key: 'clientName',
      label: 'Name',
      render: c => <span className='font-medium'>{c.clientName || c.clientId}</span>,
    },
    {
      key: 'clientId',
      label: 'Client ID',
      render: c => <code className='text-xs font-mono'>{c.clientId}</code>,
    },
    { key: 'tokenEndpointAuthMethod', label: 'Auth Method' },
    {
      key: 'clientType',
      label: 'Type',
      render: c => (
        <Badge variant={c.clientType === 'confidential' ? 'primary' : 'secondary'} size='sm'>
          {c.clientType}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: c => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: c => (
        <button
          onClick={() => handleDelete(c.clientId)}
          className='rounded-lg p-1.5 text-wise-gray-400 transition-colors hover:bg-red-50 hover:text-red-600'
          aria-label='Delete client'
        >
          <Trash2 className='w-4 h-4' />
        </button>
      ),
    },
  ];

  return (
    <div className='card-wise p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-lg font-bold tracking-tight text-wise-green-forest'>OAuth Clients</h2>
        <button
          onClick={() => setShowCreate(true)}
          className='btn-wise-primary inline-flex h-10 items-center px-4 text-sm'
        >
          <Plus className='mr-2 h-4 w-4' />
          New Client
        </button>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        emptyMessage='No OAuth clients registered for this tenant'
      />

      {/* Create client modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title='Register OAuth Client' size='lg'>
        <form onSubmit={handleCreate} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>Client Name</label>
            <input name='client_name' required className='input-wise w-full' placeholder='My Application' />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
              Redirect URIs (one per line)
            </label>
            <textarea
              name='redirect_uris'
              rows={3}
              required
              className='input-wise w-full font-mono text-sm'
              placeholder={'https://example.com/callback'}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
              Token Endpoint Auth Method
            </label>
            <select name='token_endpoint_auth_method' className='input-wise w-full' defaultValue='client_secret_basic'>
              <option value='client_secret_basic'>client_secret_basic (confidential)</option>
              <option value='client_secret_post'>client_secret_post (confidential)</option>
              <option value='none'>none (public / PKCE only)</option>
            </select>
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <div className='flex justify-end gap-3 pt-2'>
            <button type='button' onClick={() => setShowCreate(false)} className='btn-wise-secondary h-10 px-4'>
              Cancel
            </button>
            <button type='submit' disabled={submitting} className='btn-wise-primary h-10 px-4'>
              {submitting ? 'Registering…' : 'Register Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* One-time credentials modal */}
      <Modal
        isOpen={registration !== null}
        onClose={() => setRegistration(null)}
        title='Client Registered'
        size='lg'
      >
        {registration && (
          <div className='space-y-4'>
            <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4'>
              <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              <p className='text-sm text-amber-800'>
                <strong>Copy these credentials now.</strong> The client secret is shown only once.
              </p>
            </div>
            <div className='rounded-lg border border-wise-gray-200 bg-wise-gray-50 p-4'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-sm font-medium text-wise-gray-700'>Client ID</span>
                <button
                  onClick={() => copy(registration.client_id, 'id')}
                  className='p-1 hover:bg-wise-gray-200 rounded'
                  aria-label='Copy client ID'
                >
                  {copied === 'id' ? (
                    <CheckCircle className='w-4 h-4 text-green-600' />
                  ) : (
                    <Copy className='w-4 h-4 text-wise-gray-600' />
                  )}
                </button>
              </div>
              <code className='text-sm font-mono break-all'>{registration.client_id}</code>
            </div>
            {registration.client_secret && (
              <div className='rounded-lg border border-wise-gray-200 bg-wise-gray-50 p-4'>
                <div className='flex justify-between items-center mb-1'>
                  <span className='text-sm font-medium text-wise-gray-700'>Client Secret</span>
                  <button
                    onClick={() => copy(registration.client_secret!, 'secret')}
                    className='p-1 hover:bg-wise-gray-200 rounded'
                    aria-label='Copy client secret'
                  >
                    {copied === 'secret' ? (
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4 text-wise-gray-600' />
                    )}
                  </button>
                </div>
                <code className='text-sm font-mono break-all'>{registration.client_secret}</code>
              </div>
            )}
            <div className='flex justify-end'>
              <button onClick={() => setRegistration(null)} className='btn-wise-secondary h-10 px-4'>
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
