import Link from 'next/link';
import { Activity, CheckCircle, XCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { gateway, type AuditLogRow, type UsageMetricsRow } from '@/lib/gateway';
import { StatCard } from '@/components/dashboard/StatCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const outcomeVariant = {
  success: 'success',
  failure: 'danger',
  denied: 'danger',
} as const;

export default async function DashboardPage() {
  let metrics: UsageMetricsRow[];
  let logs: AuditLogRow[];
  try {
    [metrics, logs] = await Promise.all([
      gateway.usageMetrics.get({}),
      gateway.auditLogs.list({ limit: 10 }),
    ]);
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
          Could not reach the gateway admin API. Check that the gateway is running and GATEWAY_URL
          is configured.
        </p>
      </div>
    );
  }

  const totals = metrics.reduce(
    (acc, row) => ({
      total: acc.total + row.total_requests,
      success: acc.success + row.successful_requests,
      failed: acc.failed + row.failed_requests,
    }),
    { total: 0, success: 0, failed: 0 }
  );
  const successRate =
    totals.total > 0 ? `${((totals.success / totals.total) * 100).toFixed(1)}%` : '—';

  return (
    <div className='space-y-6'>
      <PageHeader
        eyebrow='Dashboard'
        title='Overview'
        description="What's happening with your MCP Gateway today."
      />

      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Total Requests' value={totals.total.toLocaleString()} icon={Activity} />
        <StatCard
          label='Successful Requests'
          value={totals.success.toLocaleString()}
          icon={CheckCircle}
        />
        <StatCard label='Failed Requests' value={totals.failed.toLocaleString()} icon={XCircle} />
        <StatCard label='Success Rate' value={successRate} icon={ShieldAlert} />
      </div>

      <div className='card-wise p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-bold tracking-tight text-wise-green-forest'>
            Recent Activity
          </h2>
          <Link
            href='/dashboard/audit-logs'
            className='text-sm font-semibold text-wise-green-primary transition hover:text-wise-green-700'
          >
            View all →
          </Link>
        </div>
        {logs.length === 0 ? (
          <div className='py-8 text-center text-wise-gray-500'>
            <AlertCircle className='mx-auto mb-2 h-8 w-8 opacity-50' />
            <p className='text-sm'>No recent activity</p>
          </div>
        ) : (
          <div className='divide-y divide-wise-gray-200'>
            {logs.map(log => (
              <div
                key={log.logId}
                className='flex items-center justify-between px-2 py-3 transition-colors hover:bg-wise-gray-50'
              >
                <div>
                  <p className='text-sm font-medium text-wise-gray-900'>{log.action}</p>
                  <p className='mt-0.5 text-xs text-wise-gray-500'>
                    {log.eventType}
                    {log.ipAddress ? ` · ${log.ipAddress}` : ''} ·{' '}
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={outcomeVariant[log.outcome] ?? 'default'} size='sm'>
                  {log.outcome}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
