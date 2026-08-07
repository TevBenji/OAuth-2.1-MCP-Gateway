'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SlidersHorizontal } from 'lucide-react';
import type { Tenant } from '@/lib/gateway';
import { updateTenant } from '@/app/dashboard/tenants/actions';

const LIMIT_FIELDS = [
  { name: 'max_users', label: 'Max Users', key: 'maxUsers' },
  { name: 'max_mcp_servers', label: 'Max MCP Servers', key: 'maxMcpServers' },
  { name: 'max_oauth_clients', label: 'Max OAuth Clients', key: 'maxOauthClients' },
  { name: 'max_requests_per_minute', label: 'Max Requests / Minute', key: 'maxRequestsPerMinute' },
] as const;

const SETTING_FIELDS = [
  { name: 'enable_audit_logging', label: 'Audit Logging', key: 'enableAuditLogging' },
  { name: 'enable_session_management', label: 'Session Management', key: 'enableSessionManagement' },
  { name: 'enable_rate_limiting', label: 'Rate Limiting', key: 'enableRateLimiting' },
  { name: 'allow_custom_scopes', label: 'Allow Custom Scopes', key: 'allowCustomScopes' },
  { name: 'require_mfa', label: 'Require MFA', key: 'requireMfa' },
] as const;

/** Edits a tenant's limits and feature toggles via the gateway admin API. */
export function TenantSettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await updateTenant(tenant.tenantId, {
        limits: {
          max_users: Number(form.get('max_users')),
          max_mcp_servers: Number(form.get('max_mcp_servers')),
          max_oauth_clients: Number(form.get('max_oauth_clients')),
          max_requests_per_minute: Number(form.get('max_requests_per_minute')),
        },
        settings: {
          enable_audit_logging: form.get('enable_audit_logging') === 'on',
          enable_session_management: form.get('enable_session_management') === 'on',
          enable_rate_limiting: form.get('enable_rate_limiting') === 'on',
          allow_custom_scopes: form.get('allow_custom_scopes') === 'on',
          require_mfa: form.get('require_mfa') === 'on',
        },
      });
      toast.success('Tenant settings saved');
      router.refresh();
    } catch {
      toast.error('Failed to save tenant settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='card-wise p-6'>
      <div className='mb-6 flex items-center gap-3'>
        <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <SlidersHorizontal className='h-[18px] w-[18px]' />
        </span>
        <h2 className='text-lg font-bold tracking-tight text-wise-green-forest'>
          Limits &amp; Settings
        </h2>
      </div>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {LIMIT_FIELDS.map(field => (
            <div key={field.name}>
              <label className='block text-sm font-medium text-wise-gray-700 mb-1'>
                {field.label}
              </label>
              <input
                type='number'
                name={field.name}
                min={1}
                defaultValue={tenant[field.key]}
                className='input-wise w-full'
              />
            </div>
          ))}
        </div>
        <div className='space-y-2'>
          {SETTING_FIELDS.map(field => (
            <label
              key={field.name}
              className='flex items-center gap-3 p-2 hover:bg-wise-gray-50 rounded-lg cursor-pointer'
            >
              <input
                type='checkbox'
                name={field.name}
                defaultChecked={tenant[field.key]}
                className='w-4 h-4 text-wise-green-primary border-wise-gray-300 rounded focus:ring-wise-green-primary'
              />
              <span className='text-sm text-wise-gray-700'>{field.label}</span>
            </label>
          ))}
        </div>
        <button type='submit' disabled={saving} className='btn-wise-primary h-10 px-6'>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
