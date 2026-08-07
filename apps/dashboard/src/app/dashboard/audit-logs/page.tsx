import { Search, ShieldAlert } from 'lucide-react';
import { gateway, type AuditLogRow } from '@/lib/gateway';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const outcomeVariant = {
  success: 'success',
  failure: 'danger',
  denied: 'danger',
} as const;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;

  let logs: AuditLogRow[];
  try {
    logs = await gateway.auditLogs.list({ limit: 100, action: action || undefined });
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
          Could not load audit logs from the gateway admin API.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Compliance'
        title='Audit Logs'
        description='Security and compliance events (latest 100)'
      >
        {/* ponytail: plain GET form — the server re-queries on submit, no client JS */}
        <form className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wise-gray-400' />
            <input
              type='text'
              name='action'
              defaultValue={action ?? ''}
              placeholder='Filter by action…'
              className='input-wise w-64 pl-10'
            />
          </div>
          <button type='submit' className='btn-wise-secondary h-10 px-4'>
            Filter
          </button>
        </form>
      </PageHeader>

      <div className='card-wise p-6'>
        {logs.length === 0 ? (
          <div className='py-8 text-center text-wise-gray-500'>
            {action ? `No audit logs matching "${action}"` : 'No audit logs yet'}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-wise-gray-200'>
                  {['Time', 'Action', 'Event Type', 'User / Client', 'IP Address', 'Outcome'].map(
                    label => (
                      <th
                        key={label}
                        className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-wise-gray-500'
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className='divide-y divide-wise-gray-200'>
                {logs.map(log => (
                  <tr key={log.logId} className='transition-colors hover:bg-wise-gray-50'>
                    <td className='whitespace-nowrap px-4 py-3 text-sm text-wise-gray-500'>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-wise-gray-900'>{log.action}</td>
                    <td className='px-4 py-3 text-sm text-wise-gray-500'>{log.eventType}</td>
                    <td className='px-4 py-3 text-sm text-wise-gray-500'>
                      {log.userId || log.clientId || '—'}
                    </td>
                    <td className='px-4 py-3 text-sm text-wise-gray-500'>{log.ipAddress || '—'}</td>
                    <td className='px-4 py-3'>
                      <Badge variant={outcomeVariant[log.outcome] ?? 'default'} size='sm'>
                        {log.outcome}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
