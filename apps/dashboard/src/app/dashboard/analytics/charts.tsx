'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AuditLogRow } from '@/lib/gateway';

/** Bar chart of audit log outcomes grouped by day. */
export function OutcomesChart({ logs }: { logs: AuditLogRow[] }) {
  const data = useMemo(() => {
    const byDay = new Map<string, { date: string; success: number; failure: number; denied: number }>();
    for (const log of logs) {
      const date = new Date(log.createdAt).toISOString().slice(0, 10);
      const entry = byDay.get(date) ?? { date, success: 0, failure: 0, denied: 0 };
      entry[log.outcome] = (entry[log.outcome] ?? 0) + 1;
      byDay.set(date, entry);
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  return (
    <div className='card-wise p-6'>
      <div className='mb-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900'>Audit Event Outcomes</h2>
        <p className='text-sm text-wise-gray-600'>Events per day by outcome (last 500 events)</p>
      </div>
      {data.length === 0 ? (
        <div className='flex items-center justify-center h-[300px] text-wise-gray-500'>
          <p>No audit events yet</p>
        </div>
      ) : (
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
            <XAxis dataKey='date' stroke='#6b7280' fontSize={12} />
            <YAxis stroke='#6b7280' fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey='success' stackId='a' fill='#9FE870' name='Success' />
            <Bar dataKey='failure' stackId='a' fill='#ef4444' name='Failure' />
            <Bar dataKey='denied' stackId='a' fill='#f59e0b' name='Denied' />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
