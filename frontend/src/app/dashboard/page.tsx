'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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

// Sample data for charts
const usageData = [
  { date: 'Jan 1', calls: 1200, tokens: 450000 },
  { date: 'Jan 2', calls: 1350, tokens: 520000 },
  { date: 'Jan 3', calls: 1100, tokens: 410000 },
  { date: 'Jan 4', calls: 1450, tokens: 580000 },
  { date: 'Jan 5', calls: 1600, tokens: 620000 },
  { date: 'Jan 6', calls: 1300, tokens: 490000 },
  { date: 'Jan 7', calls: 1750, tokens: 680000 },
];

const providerData = [
  { name: 'Google', value: 35, color: '#4285F4' },
  { name: 'GitHub', value: 28, color: '#333333' },
  { name: 'Microsoft', value: 22, color: '#00BCF2' },
  { name: 'Custom', value: 15, color: '#9FE870' },
];

const recentActivity = [
  {
    id: 1,
    type: 'auth_success',
    message: 'Successfully authenticated via Google OAuth',
    timestamp: '2 minutes ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'api_key_created',
    message: 'New API key created for Production',
    timestamp: '1 hour ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'rate_limit',
    message: 'Rate limit warning: 80% of monthly quota used',
    timestamp: '3 hours ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'token_refresh',
    message: 'OAuth tokens refreshed for GitHub provider',
    timestamp: '5 hours ago',
    status: 'success',
  },
  {
    id: 5,
    type: 'auth_failed',
    message: 'Authentication failed: Invalid credentials',
    timestamp: '1 day ago',
    status: 'error',
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const stats = [
    {
      label: 'Total API Calls',
      value: '24.5K',
      change: '+12.5%',
      trend: 'up',
      icon: Activity,
      color: 'text-wise-green-primary',
      bgColor: 'bg-wise-green-50',
    },
    {
      label: 'Active Projects',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'OAuth Providers',
      value: '5',
      change: '0',
      trend: 'neutral',
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Team Members',
      value: '12',
      change: '+3',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

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

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='loader-wise'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className='text-wise-gray-600 mt-1'>
            Here's what's happening with your MCP Gateway today.
          </p>
        </div>
        <div className='flex items-center space-x-3 mt-4 md:mt-0'>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className='px-4 py-2 bg-white border border-wise-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20'
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className='card-wise p-6'>
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
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-lg font-semibold text-wise-gray-900'>API Usage</h2>
              <p className='text-sm text-wise-gray-600'>Calls and tokens over time</p>
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
            <AreaChart data={usageData}>
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
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-wise-gray-900'>OAuth Providers</h2>
            <p className='text-sm text-wise-gray-600'>Distribution by provider</p>
          </div>
          <ResponsiveContainer width='100%' height={200}>
            <PieChart>
              <Pie
                data={providerData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey='value'
              >
                {providerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className='mt-4 space-y-2'>
            {providerData.map((provider) => (
              <div key={provider.name} className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-2'
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className='text-sm text-wise-gray-700'>{provider.name}</span>
                </div>
                <span className='text-sm font-medium text-wise-gray-900'>{provider.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Recent Activity */}
        <div className='lg:col-span-2 card-wise p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-lg font-semibold text-wise-gray-900'>Recent Activity</h2>
            <Link
              href='/dashboard/activity'
              className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium'
            >
              View All →
            </Link>
          </div>
          <div className='space-y-3'>
            {recentActivity.map((activity) => (
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
            ))}
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
      <div className='card-wise p-6 bg-gradient-to-r from-wise-green-50 to-wise-green-100/50'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-wise-gray-900'>
              You're on the Starter Plan
            </h3>
            <p className='text-sm text-wise-gray-600 mt-1'>
              You've used 2,451 of 10,000 API calls this month
            </p>
            <div className='mt-3'>
              <div className='w-full max-w-xs h-2 bg-white/50 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-wise-green-primary rounded-full transition-all duration-300'
                  style={{ width: '24.51%' }}
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
              Upgrade Plan
            </Link>
            <p className='text-xs text-wise-gray-600'>Get more API calls & features</p>
          </div>
        </div>
      </div>
    </div>
  );
}
