import { Activity, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { gateway, type AuditLogRow, type UsageMetricsRow } from '@/lib/gateway';
import { StatCard } from '@/components/dashboard/StatCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
        <span className='mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <ShieldAlert className='h-6 w-6' />
        </span>
        <h2 className='mb-2 text-lg font-bold tracking-tight text-wise-green-forest'>
          Gateway unreachable
        </h2>
        <p className='mx-auto max-w-md text-sm text-wise-gray-500'>
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
      <PageHeader
        eyebrow='Insights'
        title='Analytics'
        description='Gateway usage and audit event outcomes over time'
      />

      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Total Requests' value={totals.total.toLocaleString()} icon={Activity} />
        <StatCard label='Successful' value={totals.success.toLocaleString()} icon={CheckCircle} />
        <StatCard label='Failed' value={totals.failed.toLocaleString()} icon={XCircle} />
        <StatCard label='Success Rate' value={successRate} icon={ShieldAlert} />
      </div>

      <OutcomesChart logs={logs} />
    </div>
  );
}
