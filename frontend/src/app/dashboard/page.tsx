'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  ArrowUpRight,
  ArrowDownRight,
  Key,
  Shield,
  Globe,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  Plus,
  ExternalLink,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  Database,
  CreditCard,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  stats: {
    totalApiCalls: number;
    activeProjects: number;
    oauthProviders: number;
    teamMembers: number;
  };
  usageData: Array<{ date: string; calls: number; tokens: number }>;
  providerData: Array<{ name: string; value: number; color: string }>;
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState('7d');
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(true);
  const { isCompleted: onboardingCompleted, isLoading: onboardingLoading } = useOnboarding();

  // Convex queries
  const dashboardStats = useQuery(api.users.getDashboard, user?.id ? { clerkId: user.id } : 'skip');
  const usageStats = useQuery(
    api.usage.getStats,
    user?.id
      ? {
          clerkId: user.id,
          days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90,
        }
      : 'skip'
  );
  const auditLogs = useQuery(
    api.usage.getAuditLogs,
    user?.id ? { clerkId: user.id, limit: 5 } : 'skip'
  );
  const oauthConfigs = useQuery(api.oauth.getConfigs, user?.id ? { clerkId: user.id } : 'skip');
  const subscription = useQuery(
    api.users.getSubscription,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const loading =
    dashboardStats === undefined ||
    usageStats === undefined ||
    auditLogs === undefined ||
    oauthConfigs === undefined;

  // Calculate OAuth provider distribution from real data
  const providerCounts: Record<string, number> = {};
  (oauthConfigs || []).forEach((config: any) => {
    providerCounts[config.provider] = (providerCounts[config.provider] || 0) + 1;
  });

  const totalProviders = Object.values(providerCounts).reduce((sum, count) => sum + count, 0);
  const providerData = Object.entries(providerCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: totalProviders > 0 ? Math.round((count / totalProviders) * 100) : 0,
    color:
      name === 'google'
        ? '#4285F4'
        : name === 'github'
          ? '#333333'
          : name === 'microsoft'
            ? '#00BCF2'
            : '#9FE870',
  }));

  // Transform the data for the dashboard
  const dashboardData = loading
    ? null
    : {
        stats: {
          totalApiCalls: dashboardStats?.totalApiCalls || 0,
          activeProjects: dashboardStats?.activeProjects || 0,
          oauthProviders: dashboardStats?.activeOAuthClients || 0,
          teamMembers: dashboardStats?.teamMembers || 0,
        },
        usageData: usageStats || [],
        providerData: providerData.length > 0 ? providerData : [],
        recentActivity: (auditLogs || []).map((log: any, index: number) => ({
          id: index + 1,
          type: log.action || 'unknown',
          message: log.details || 'No details available',
          timestamp: new Date(log.createdAt).toLocaleString(),
          status: log.action?.includes('success')
            ? 'success'
            : log.action?.includes('fail')
              ? 'error'
              : 'info',
        })),
      };

  const stats = dashboardData
    ? [
        {
          label: 'Total API Calls',
          value: dashboardData.stats.totalApiCalls.toLocaleString(),
          change: '+12.5%',
          trend: 'up',
          icon: Activity,
          color: 'text-wise-green-primary',
          bgColor: 'bg-wise-green-50',
        },
        {
          label: 'Active Projects',
          value: dashboardData.stats.activeProjects.toString(),
          change: '+2',
          trend: 'up',
          icon: Server,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          label: 'OAuth Providers',
          value: dashboardData.stats.oauthProviders.toString(),
          change: '0',
          trend: 'neutral',
          icon: Globe,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          label: 'Team Members',
          value: dashboardData.stats.teamMembers.toString(),
          change: '+3',
          trend: 'up',
          icon: Users,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        },
      ]
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-4 h-4 text-wise-green-primary' />;
      case 'error':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'warning':
        return <AlertCircle className='w-4 h-4 text-yellow-500' />;
      default:
        return <AlertCircle className='w-4 h-4 text-blue-500' />;
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center' suppressHydrationWarning>
        <div className='flex flex-col items-center' suppressHydrationWarning>
          <div
            className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'
            suppressHydrationWarning
          ></div>
          <p className='text-wise-gray-600' suppressHydrationWarning>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Onboarding Prompt - Show for new users who haven't completed onboarding */}
      {!onboardingLoading && !onboardingCompleted && showOnboardingPrompt && (
        <div className='bg-gradient-to-r from-wise-green-50 to-wise-green-100/50 border border-wise-green-200 rounded-lg p-6 shadow-sm' suppressHydrationWarning>
          <div className='flex items-start justify-between'>
            <div className='flex items-start space-x-4'>
              <div className='p-2 bg-wise-green-primary/10 rounded-lg mt-1'>
                <Sparkles className='w-5 h-5 text-wise-green-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-wise-gray-900' suppressHydrationWarning>
                  Welcome to OAuth 2.1 MCP Gateway!
                </h3>
                <p className='text-sm text-wise-gray-700 mt-1' suppressHydrationWarning>
                  Complete our quick setup guide to configure your first OAuth client and MCP server.
                  It takes about 5 minutes.
                </p>
                <Link
                  href='/onboarding'
                  className='inline-block mt-3 btn-wise-primary px-6 py-2 text-sm'
                  suppressHydrationWarning
                >
                  Start Setup Guide
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowOnboardingPrompt(false)}
              className='p-1 rounded-lg hover:bg-white/50 transition-colors'
              aria-label='Dismiss'
            >
              <X className='w-5 h-5 text-wise-gray-500' />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900' suppressHydrationWarning>
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className='text-wise-gray-600 mt-1' suppressHydrationWarning>
            Here's what's happening with your MCP Gateway today.
          </p>
        </div>
        <div className='flex items-center space-x-3 mt-4 md:mt-0'>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className='px-4 py-2 bg-white border border-wise-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20'
            suppressHydrationWarning
          >
            <option value='24h'>Last 24 hours</option>
            <option value='7d'>Last 7 days</option>
            <option value='30d'>Last 30 days</option>
            <option value='90d'>Last 90 days</option>
          </select>
          <Link
            href='/dashboard/organization/projects/new'
            className='btn-wise-primary px-4 py-2 flex items-center'
          >
            <Plus className='w-4 h-4 mr-2' />
            New Project
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
        suppressHydrationWarning
      >
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className='card-wise p-6' suppressHydrationWarning>
              <div className='flex items-center justify-between'>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className='flex items-center space-x-1'>
                  {stat.trend === 'up' && (
                    <>
                      <ArrowUpRight className='w-4 h-4 text-wise-green-primary' />
                      <span className='text-sm font-medium text-wise-green-primary'>
                        {stat.change}
                      </span>
                    </>
                  )}
                  {stat.trend === 'down' && (
                    <>
                      <ArrowDownRight className='w-4 h-4 text-red-500' />
                      <span className='text-sm font-medium text-red-500'>{stat.change}</span>
                    </>
                  )}
                  {stat.trend === 'neutral' && (
                    <span className='text-sm font-medium text-wise-gray-500'>{stat.change}</span>
                  )}
                </div>
              </div>
              <div className='mt-4'>
                <h3 className='text-2xl font-bold text-wise-gray-900'>{stat.value}</h3>
                <p className='text-sm text-wise-gray-600 mt-1'>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* API Usage Chart */}
        <div className='lg:col-span-2 card-wise p-6'>
          <div className='flex items-center justify-between mb-6' suppressHydrationWarning>
            <div>
              <h2 className='text-lg font-semibold text-wise-gray-900' suppressHydrationWarning>
                API Usage
              </h2>
              <p className='text-sm text-wise-gray-600' suppressHydrationWarning>
                Calls and tokens over time
              </p>
            </div>
            <div className='flex items-center space-x-4 text-sm'>
              <div className='flex items-center'>
                <div className='w-3 h-3 bg-wise-green-primary rounded-full mr-2' />
                <span className='text-wise-gray-600'>API Calls</span>
              </div>
              <div className='flex items-center'>
                <div className='w-3 h-3 bg-blue-500 rounded-full mr-2' />
                <span className='text-wise-gray-600'>Tokens</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={dashboardData.usageData}>
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
                dataKey='calls'
                stroke='#1DB954'
                fill='#9FE870'
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Distribution */}
        <div className='card-wise p-6'>
          <div className='mb-6' suppressHydrationWarning>
            <h2 className='text-lg font-semibold text-wise-gray-900' suppressHydrationWarning>
              OAuth Providers
            </h2>
            <p className='text-sm text-wise-gray-600' suppressHydrationWarning>
              Distribution by provider
            </p>
          </div>
          {dashboardData.providerData.length > 0 ? (
            <>
              <ResponsiveContainer width='100%' height={200}>
                <PieChart>
                  <Pie
                    data={dashboardData.providerData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey='value'
                  >
                    {dashboardData.providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className='mt-4 space-y-2'>
                {dashboardData.providerData.map(provider => (
                  <div key={provider.name} className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <div
                        className='w-3 h-3 rounded-full mr-2'
                        style={{ backgroundColor: provider.color }}
                      />
                      <span className='text-sm text-wise-gray-700'>{provider.name}</span>
                    </div>
                    <span className='text-sm font-medium text-wise-gray-900'>
                      {provider.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='text-center py-12'>
              <Globe className='w-12 h-12 text-wise-gray-300 mx-auto mb-3' />
              <p className='text-sm text-wise-gray-600 mb-2'>No OAuth providers configured</p>
              <p className='text-xs text-wise-gray-500'>
                Create a project and add OAuth providers to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Recent Activity */}
        <div className='lg:col-span-2 card-wise p-6'>
          <div className='flex items-center justify-between mb-6' suppressHydrationWarning>
            <h2 className='text-lg font-semibold text-wise-gray-900' suppressHydrationWarning>
              Recent Activity
            </h2>
            <Link
              href='/dashboard/activity'
              className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium'
              suppressHydrationWarning
            >
              View All →
            </Link>
          </div>
          <div className='space-y-3'>
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className='flex items-start space-x-3 p-3 rounded-lg hover:bg-wise-gray-50 transition-colors'
                >
                  {getStatusIcon(activity.status)}
                  <div className='flex-1'>
                    <p className='text-sm text-wise-gray-900'>{activity.message}</p>
                    <p className='text-xs text-wise-gray-500 mt-1'>{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8 text-wise-gray-500'>
                <Activity className='w-8 h-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='card-wise p-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900 mb-6'>Quick Actions</h2>
          <div className='space-y-3'>
            <Link
              href='/dashboard/organization/api-keys/new'
              className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
            >
              <div className='flex items-center'>
                <Key className='w-5 h-5 text-wise-gray-600 mr-3' />
                <span className='text-sm font-medium text-wise-gray-900'>Create API Key</span>
              </div>
              <ExternalLink className='w-4 h-4 text-wise-gray-400 group-hover:text-wise-green-primary' />
            </Link>
            <Link
              href='/dashboard/organization/projects'
              className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
            >
              <div className='flex items-center'>
                <Server className='w-5 h-5 text-wise-gray-600 mr-3' />
                <span className='text-sm font-medium text-wise-gray-900'>Manage Projects</span>
              </div>
              <ExternalLink className='w-4 h-4 text-wise-gray-400 group-hover:text-wise-green-primary' />
            </Link>
            <Link
              href='/docs'
              className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
            >
              <div className='flex items-center'>
                <FileText className='w-5 h-5 text-wise-gray-600 mr-3' />
                <span className='text-sm font-medium text-wise-gray-900'>Documentation</span>
              </div>
              <ExternalLink className='w-4 h-4 text-wise-gray-400 group-hover:text-wise-green-primary' />
            </Link>
            <Link
              href='/dashboard/billing/overview'
              className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
            >
              <div className='flex items-center'>
                <CreditCard className='w-5 h-5 text-wise-gray-600 mr-3' />
                <span className='text-sm font-medium text-wise-gray-900'>Billing</span>
              </div>
              <ExternalLink className='w-4 h-4 text-wise-gray-400 group-hover:text-wise-green-primary' />
            </Link>
            <Link
              href='/dashboard/settings'
              className='flex items-center justify-between p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
            >
              <div className='flex items-center'>
                <Settings className='w-5 h-5 text-wise-gray-600 mr-3' />
                <span className='text-sm font-medium text-wise-gray-900'>Settings</span>
              </div>
              <ExternalLink className='w-4 h-4 text-wise-gray-400 group-hover:text-wise-green-primary' />
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      {subscription && (
        <div className='card-wise p-6 bg-gradient-to-r from-wise-green-50 to-wise-green-100/50'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-wise-gray-900'>
                You're on the{' '}
                {subscription.plan.charAt(0) + subscription.plan.slice(1).toLowerCase()} Plan
              </h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                You've used {subscription.apiCallsUsed.toLocaleString()} of{' '}
                {subscription.apiCallLimit.toLocaleString()} API calls this month
              </p>
              <div className='mt-3'>
                <div className='w-full max-w-xs h-2 bg-white/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-wise-green-primary rounded-full transition-all duration-300'
                    style={{
                      width: `${Math.min(100, (subscription.apiCallsUsed / subscription.apiCallLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='flex flex-col items-end space-y-2'>
              <Link
                href='/dashboard/billing/overview'
                className='btn-wise-primary px-6 py-2 flex items-center'
              >
                <TrendingUp className='w-4 h-4 mr-2' />
                {subscription.plan === 'FREE' ? 'Upgrade Plan' : 'Manage Plan'}
              </Link>
              <p className='text-xs text-wise-gray-600'>
                {subscription.plan === 'FREE'
                  ? 'Get more API calls & features'
                  : 'Review your current plan'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
