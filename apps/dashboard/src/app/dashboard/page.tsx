import Link from 'next/link';
import { Activity, CheckCircle, XCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { gateway, type AuditLogRow, type UsageMetricsRow } from '@/lib/gateway';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const outcomeVariant = {
  success: 'success',
  failure: 'danger',
  denied: 'warning',
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
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>
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
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Overview</h1>
        <p className='text-wise-gray-600 mt-1'>
          What&apos;s happening with your MCP Gateway today.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard label='Total Requests' value={totals.total.toLocaleString()} icon={Activity} />
        <StatCard
          label='Successful Requests'
          value={totals.success.toLocaleString()}
          icon={CheckCircle}
          color='blue'
        />
        <StatCard
          label='Failed Requests'
          value={totals.failed.toLocaleString()}
          icon={XCircle}
          color='red'
        />
        <StatCard label='Success Rate' value={successRate} icon={ShieldAlert} color='purple' />
      </div>

      <div className='card-wise p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900'>Recent Activity</h2>
          <Link
            href='/dashboard/audit-logs'
            className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium'
          >
            View All →
          </Link>
        </div>
        {logs.length === 0 ? (
          <div className='text-center py-8 text-wise-gray-500'>
            <AlertCircle className='w-8 h-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>No recent activity</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {logs.map(log => (
              <div
                key={log.logId}
                className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors'
              >
                <div>
                  <p className='text-sm font-medium text-wise-gray-900'>{log.action}</p>
                  <p className='text-xs text-wise-gray-500 mt-0.5'>
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
