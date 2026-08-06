'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Activity,
  Server,
  Users,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function UsageLimitsPage() {
  const { user } = useUser();
  const limits = useQuery(api.limits.getUsageLimits, user?.id ? { clerkId: user.id } : 'skip');
  const breakdown = useQuery(api.limits.getUsageBreakdown, user?.id ? { clerkId: user.id, days: 30 } : 'skip');
  const usageOverTime = useQuery(api.limits.getUsageOverTime, user?.id ? { clerkId: user.id, days: 30 } : 'skip');

  const loading = limits === undefined || breakdown === undefined || usageOverTime === undefined;

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading usage limits...</p>
        </div>
      </div>
    );
  }

  const apiUsagePercent = limits ? (limits.apiCallsUsed / limits.apiCallLimit) * 100 : 0;
  const projectUsagePercent = limits ? (limits.currentProjects / limits.projectLimit) * 100 : 0;
  const teamUsagePercent = limits ? (limits.currentTeamMembers / limits.teamMemberLimit) * 100 : 0;

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 75) return 'text-orange-500';
    return 'text-wise-green-primary';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-orange-500';
    return 'bg-wise-green-primary';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Usage & Limits</h1>
        <p className='text-wise-gray-600 mt-1'>
          Monitor your API usage and account limits
        </p>
      </div>

      {/* Alerts */}
      {apiUsagePercent >= 90 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3'>
          <AlertCircle className='w-5 h-5 text-red-500 mt-0.5' />
          <div>
            <h3 className='font-semibold text-red-900'>API Limit Warning</h3>
            <p className='text-sm text-red-700 mt-1'>
              You've used {apiUsagePercent.toFixed(0)}% of your API call limit. Consider upgrading your plan.
            </p>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-medium text-wise-gray-700'>API Calls</h3>
            <Activity className='w-5 h-5 text-wise-gray-400' />
          </div>
          <div className='space-y-3'>
            <div>
              <div className='flex items-baseline justify-between mb-1'>
                <span className={`text-2xl font-bold ${getUsageColor(apiUsagePercent)}`}>
                  {limits?.apiCallsUsed.toLocaleString() || 0}
                </span>
                <span className='text-sm text-wise-gray-600'>
                  / {limits?.apiCallLimit.toLocaleString() || 0}
                </span>
              </div>
              <div className='w-full h-2 bg-wise-gray-100 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getProgressColor(apiUsagePercent)} transition-all duration-300`}
                  style={{ width: `${Math.min(apiUsagePercent, 100)}%` }}
                />
              </div>
            </div>
            <p className='text-xs text-wise-gray-500'>
              {apiUsagePercent.toFixed(1)}% of limit used
            </p>
          </div>
        </div>

        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-medium text-wise-gray-700'>Projects</h3>
            <Server className='w-5 h-5 text-wise-gray-400' />
          </div>
          <div className='space-y-3'>
            <div>
              <div className='flex items-baseline justify-between mb-1'>
                <span className={`text-2xl font-bold ${getUsageColor(projectUsagePercent)}`}>
                  {limits?.currentProjects || 0}
                </span>
                <span className='text-sm text-wise-gray-600'>
                  / {limits?.projectLimit || 0}
                </span>
              </div>
              <div className='w-full h-2 bg-wise-gray-100 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getProgressColor(projectUsagePercent)} transition-all duration-300`}
                  style={{ width: `${Math.min(projectUsagePercent, 100)}%` }}
                />
              </div>
            </div>
            <p className='text-xs text-wise-gray-500'>
              {projectUsagePercent.toFixed(1)}% of limit used
            </p>
          </div>
        </div>

        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-medium text-wise-gray-700'>Team Members</h3>
            <Users className='w-5 h-5 text-wise-gray-400' />
          </div>
          <div className='space-y-3'>
            <div>
              <div className='flex items-baseline justify-between mb-1'>
                <span className={`text-2xl font-bold ${getUsageColor(teamUsagePercent)}`}>
                  {limits?.currentTeamMembers || 0}
                </span>
                <span className='text-sm text-wise-gray-600'>
                  / {limits?.teamMemberLimit || 0}
                </span>
              </div>
              <div className='w-full h-2 bg-wise-gray-100 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${getProgressColor(teamUsagePercent)} transition-all duration-300`}
                  style={{ width: `${Math.min(teamUsagePercent, 100)}%` }}
                />
              </div>
            </div>
            <p className='text-xs text-wise-gray-500'>
              {teamUsagePercent.toFixed(1)}% of limit used
            </p>
          </div>
        </div>
      </div>

      {/* Usage Over Time Chart */}
      <div className='card-wise p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-lg font-semibold text-wise-gray-900'>API Usage Trend</h2>
            <p className='text-sm text-wise-gray-600'>Last 30 days</p>
          </div>
          <BarChart3 className='w-5 h-5 text-wise-gray-400' />
        </div>
        {usageOverTime && usageOverTime.length > 0 ? (
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={usageOverTime}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
              <XAxis dataKey='date' stroke='#6b7280' fontSize={12} />
              <YAxis stroke='#6b7280' fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type='monotone'
                dataKey='count'
                stroke='#1DB954'
                fill='#9FE870'
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className='text-center py-12 text-wise-gray-500'>
            <TrendingUp className='w-12 h-12 mx-auto mb-3 opacity-50' />
            <p>No usage data available yet</p>
          </div>
        )}
      </div>

      {/* Usage Breakdown */}
      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>Usage Breakdown by Resource</h2>
        {breakdown && breakdown.length > 0 ? (
          <div className='space-y-4'>
            {breakdown.map((item, index) => (
              <div key={index} className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
                <div className='flex-1'>
                  <h3 className='font-medium text-wise-gray-900'>{item.resource}</h3>
                  <p className='text-sm text-wise-gray-600 mt-1'>
                    {item.successCount} successful, {item.errorCount} errors
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-wise-gray-900'>{item.count.toLocaleString()}</p>
                  <p className='text-sm text-wise-gray-600'>requests</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-wise-gray-500'>
            No resource usage data available
          </div>
        )}
      </div>

      {/* Plan Info */}
      {limits && (
        <div className='card-wise p-6 bg-gradient-to-r from-wise-green-50 to-wise-green-100/50'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-wise-gray-900'>
                Current Plan: {limits.plan}
              </h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Status: <span className='font-medium text-wise-green-primary'>{limits.status}</span>
              </p>
            </div>
            <a
              href='/dashboard/billing/overview'
              className='btn-wise-primary px-6 py-2 flex items-center'
            >
              <TrendingUp className='w-4 h-4 mr-2' />
              Upgrade Plan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
