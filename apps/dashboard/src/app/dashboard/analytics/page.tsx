import { Activity, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { gateway, type AuditLogRow, type UsageMetricsRow } from '@/lib/gateway';
import { StatCard } from '@/components/dashboard/StatCard';
import { OutcomesChart } from './charts';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  let metrics: UsageMetricsRow[];
  let logs: AuditLogRow[];
  try {
    [metrics, logs] = await Promise.all([
      gateway.usageMetrics.get({}),
      gateway.auditLogs.list({ limit: 500 }),
    ]);
  } catch {
    return (
      <div className='card-wise p-12 text-center'>
        <ShieldAlert className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-2'>Gateway unreachable</h2>
        <p className='text-wise-gray-600'>
          Could not reach the gateway admin API to load analytics.
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
        <h1 className='text-3xl font-bold text-wise-gray-900'>Analytics</h1>
        <p className='text-wise-gray-600 mt-1'>
          Gateway usage and audit event outcomes over time
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard label='Total Requests' value={totals.total.toLocaleString()} icon={Activity} />
        <StatCard
          label='Successful'
          value={totals.success.toLocaleString()}
          icon={CheckCircle}
          color='blue'
        />
        <StatCard
          label='Failed'
          value={totals.failed.toLocaleString()}
          icon={XCircle}
          color='red'
        />
        <StatCard label='Success Rate' value={successRate} icon={ShieldAlert} color='purple' />
      </div>

      <OutcomesChart logs={logs} />
    </div>
  );
}
