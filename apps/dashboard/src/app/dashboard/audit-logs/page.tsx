import { Search, ShieldAlert } from 'lucide-react';
import { gateway, type AuditLogRow } from '@/lib/gateway';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const outcomeVariant = {
  success: 'success',
  failure: 'danger',
  denied: 'warning',
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
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>Could not load audit logs from the gateway admin API.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Audit Logs</h1>
          <p className='text-wise-gray-600 mt-1'>Security and compliance events (latest 100)</p>
        </div>
        {/* ponytail: plain GET form — the server re-queries on submit, no client JS */}
        <form className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wise-gray-400' />
            <input
              type='text'
              name='action'
              defaultValue={action ?? ''}
              placeholder='Filter by action…'
              className='input-wise pl-10 w-64'
            />
          </div>
          <button type='submit' className='btn-wise-secondary px-4 py-2'>
            Filter
          </button>
        </form>
      </div>

      <div className='card-wise p-6'>
        {logs.length === 0 ? (
          <div className='text-center py-8 text-wise-gray-500'>
            {action ? `No audit logs matching "${action}"` : 'No audit logs yet'}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-wise-gray-200'>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>Time</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>Action</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>Event Type</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>User / Client</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>IP Address</th>
                  <th className='px-4 py-3 text-left text-sm font-medium text-wise-gray-700'>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.logId} className='border-b border-wise-gray-100 hover:bg-wise-gray-50'>
                    <td className='px-4 py-3 text-sm text-wise-gray-600 whitespace-nowrap'>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className='px-4 py-3 text-sm font-medium text-wise-gray-900'>{log.action}</td>
                    <td className='px-4 py-3 text-sm text-wise-gray-600'>{log.eventType}</td>
                    <td className='px-4 py-3 text-sm text-wise-gray-600'>
                      {log.userId || log.clientId || '—'}
                    </td>
                    <td className='px-4 py-3 text-sm text-wise-gray-600'>{log.ipAddress || '—'}</td>
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
