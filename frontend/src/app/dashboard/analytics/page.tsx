'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
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
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Shield,
  Server,
  Globe,
  Clock,
  Filter,
  Download,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  uniqueUsers: number;
  activeClients: number;
  averageResponseTime: number;
  errorRate: number;
}

interface TimeSeriesData {
  timestamp: string;
  requests: number;
  tokens: number;
  errors: number;
  users: number;
}

interface OAuthProviderData {
  provider: string;
  requests: number;
  successRate: number;
  color: string;
}

interface TenantData {
  tenantId: string;
  tenantName: string;
  requests: number;
  errorRate: number;
  status: 'active' | 'warning' | 'error';
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('requests');

  // Mock data - in production, these would come from your backend
  const analyticsData: AnalyticsData = {
    totalRequests: 1542892,
    successfulRequests: 1537456,
    failedRequests: 5436,
    uniqueUsers: 12456,
    activeClients: 892,
    averageResponseTime: 45,
    errorRate: 0.35,
  };

  const timeSeriesData: TimeSeriesData[] = [
    { timestamp: '2024-01-01', requests: 125000, tokens: 890000, errors: 450, users: 1200 },
    { timestamp: '2024-01-02', requests: 132000, tokens: 945000, errors: 380, users: 1350 },
    { timestamp: '2024-01-03', requests: 145000, tokens: 1020000, errors: 420, users: 1420 },
    { timestamp: '2024-01-04', requests: 138000, tokens: 980000, errors: 390, users: 1380 },
    { timestamp: '2024-01-05', requests: 156000, tokens: 1120000, errors: 410, users: 1520 },
    { timestamp: '2024-01-06', requests: 142000, tokens: 1010000, errors: 370, users: 1450 },
    { timestamp: '2024-01-07', requests: 148000, tokens: 1050000, errors: 390, users: 1490 },
  ];

  const oauthProviderData: OAuthProviderData[] = [
    { provider: 'Google', requests: 678234, successRate: 99.8, color: '#4285F4' },
    { provider: 'GitHub', requests: 456789, successRate: 99.6, color: '#333333' },
    { provider: 'Microsoft', requests: 234567, successRate: 99.7, color: '#00BCF2' },
    { provider: 'Custom', requests: 173302, successRate: 99.5, color: '#9FE870' },
  ];

  const tenantData: TenantData[] = [
    { tenantId: 'tenant-1', tenantName: 'Acme Corp', requests: 456789, errorRate: 0.2, status: 'active' },
    { tenantId: 'tenant-2', tenantName: 'Tech Solutions', requests: 345678, errorRate: 0.4, status: 'active' },
    { tenantId: 'tenant-3', tenantName: 'Digital Innovations', requests: 234567, errorRate: 0.6, status: 'warning' },
    { tenantId: 'tenant-4', tenantName: 'Cloud Services', requests: 189456, errorRate: 1.2, status: 'error' },
    { tenantId: 'tenant-5', tenantName: 'Data Analytics', requests: 156789, errorRate: 0.3, status: 'active' },
  ];

  const successRequests = analyticsData.successfulRequests;
  const totalRequests = analyticsData.totalRequests;
  const successRate = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;

  const statCards = [
    {
      title: 'Total Requests',
      value: analyticsData.totalRequests.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-wise-green-primary',
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(2)}%`,
      change: '+0.8%',
      trend: 'up' as const,
      icon: Shield,
      color: 'text-blue-600',
    },
    {
      title: 'Unique Users',
      value: analyticsData.uniqueUsers.toLocaleString(),
      change: '+18.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Avg Response Time',
      value: `${analyticsData.averageResponseTime}ms`,
      change: '-5.3%',
      trend: 'down' as const,
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const downloadReport = () => {
    const csvContent = [
      'Date,Requests,Tokens,Errors,Users',
      ...timeSeriesData.map(row =>
        `${row.timestamp},${row.requests},${row.tokens},${row.errors},${row.users}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-wise-gray-900">Analytics Dashboard</h1>
          <p className="text-wise-gray-600 mt-1">
            Monitor OAuth 2.1 MCP Gateway performance and usage
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-wise"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={downloadReport}
            className="btn-wise-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-wise p-6">
              <div className="flex items-center justify-between">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stat.color.includes('green') ? 'bg-wise-green-50' :
                    stat.color.includes('blue') ? 'bg-blue-50' :
                    stat.color.includes('purple') ? 'bg-purple-50' :
                    'bg-orange-50'
                  }`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-wise-green-primary" />
                      <span className="text-sm font-medium text-wise-green-primary">
                        {stat.change}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{stat.change}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-wise-gray-900">{stat.value}</h3>
                <p className="text-sm text-wise-gray-600 mt-1">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests Over Time */}
        <div className="lg:col-span-2 card-wise p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-wise-gray-900">Requests Over Time</h2>
              <p className="text-sm text-wise-gray-600">API requests and user activity</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-wise-green-primary rounded-full mr-2" />
                <span className="text-wise-gray-600">Requests</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                <span className="text-wise-gray-600">Users</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatTimestamp}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => formatTimestamp(value as string)}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#1DB954"
                fill="#9FE870"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* OAuth Provider Distribution */}
        <div className="card-wise p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-wise-gray-900">OAuth Providers</h2>
            <p className="text-sm text-wise-gray-600">Request distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={oauthProviderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="requests"
              >
                {oauthProviderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {oauthProviderData.map((provider, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className="text-sm text-wise-gray-700">{provider.provider}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-wise-gray-900">
                    {provider.requests.toLocaleString()}
                  </div>
                  <div className="text-xs text-wise-gray-500">
                    {provider.successRate}% success
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tenant Performance */}
      <div className="card-wise p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-wise-gray-900">Tenant Performance</h2>
            <p className="text-sm text-wise-gray-600">Request volume and error rates by tenant</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-wise-gray-50 rounded-lg">
              <Filter className="w-4 h-4 text-wise-gray-600" />
            </button>
            <button className="p-2 hover:bg-wise-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-wise-gray-600" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-wise-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-wise-gray-700">Tenant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-wise-gray-700">Requests</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-wise-gray-700">Error Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-wise-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenantData.map((tenant, index) => (
                <tr key={index} className="border-b border-wise-gray-100 hover:bg-wise-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-wise-gray-900">
                    {tenant.tenantName}
                  </td>
                  <td className="px-4 py-3 text-sm text-wise-gray-900">
                    {tenant.requests.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      tenant.errorRate < 0.5 ? 'text-wise-green-primary' :
                      tenant.errorRate < 1.0 ? 'text-yellow-600' :
                      'text-red-500'
                    }`}>
                      {tenant.errorRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tenant.status === 'active' ? 'bg-wise-green-100 text-wise-green-800' :
                      tenant.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-wise p-6">
          <h2 className="text-lg font-semibold text-wise-gray-900 mb-4">Error Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatTimestamp}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => formatTimestamp(value as string)}
              />
              <Bar dataKey="errors" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-wise p-6">
          <h2 className="text-lg font-semibold text-wise-gray-900 mb-4">Token Usage</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatTimestamp}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => formatTimestamp(value as string)}
              />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
