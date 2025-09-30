import { FC, useState } from 'react';
import { UsageMetrics } from '../../types/usage';
import { TenantBilling } from '../../types/usage';

// Mock data for charts
const mockChartData = [
  { name: 'Jan', requests: 4000, successful: 3950, failed: 50 },
  { name: 'Feb', requests: 3000, successful: 2980, failed: 20 },
  { name: 'Mar', requests: 2000, successful: 1980, failed: 20 },
  { name: 'Apr', requests: 2780, successful: 2750, failed: 30 },
  { name: 'May', requests: 1890, successful: 1880, failed: 10 },
  { name: 'Jun', requests: 2390, successful: 2350, failed: 40 },
  { name: 'Jul', requests: 3490, successful: 3450, failed: 40 },
];

export interface UsageAnalyticsProps {
  usage?: UsageMetrics;
  billing?: TenantBilling;
}

export const UsageAnalytics: FC<UsageAnalyticsProps> = ({ 
  usage,
  billing 
}) => {
  const [dateRange, setDateRange] = useState('month');
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Calculate usage percentages for the gauge
  const requestPercentage = usage 
    ? Math.min(100, (usage.total_requests / 100000) * 100) 
    : 0; // 100000 is the max requests for the free tier
  
  // Calculate billing info
  const billingInfo = {
    currentUsage: usage?.total_requests || 0,
    limit: billing?.limits?.requests_per_month || 10000,
    percentage: usage ? (usage.total_requests / (billing?.limits?.requests_per_month || 10000)) * 100 : 0,
    estimatedCost: usage?.estimated_cost || 0,
    currency: usage?.currency || 'USD'
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Usage Analytics & Billing</h2>
        <div className="flex space-x-4">
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Tenants</option>
            <option value="tenant-1">Acme Corp</option>
            <option value="tenant-2">Globex Inc</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {usage?.total_requests?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">This {dateRange}</p>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Successful Requests</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {usage?.successful_requests?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Success rate: 
            {usage ? ` ${(usage.successful_requests / usage.total_requests * 100).toFixed(2)}%` : ' 0%'}</p>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {usage?.average_response_time_ms?.toFixed(2) || '0'}ms
          </p>
          <p className="text-sm text-gray-500 mt-1">Response time</p>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Estimated Cost</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {billingInfo.currency} {billingInfo.estimatedCost.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">This billing period</p>
        </div>
      </div>

      {/* Usage Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage vs Limit</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Circular progress chart */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${requestPercentage * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
                {/* Center text */}
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dy="0.3em"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#1f2937"
                >
                  {requestPercentage.toFixed(1)}%
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#6b7280"
                >
                  Requests
                </text>
              </svg>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {usage?.total_requests?.toLocaleString() || '0'} of {billing?.limits?.requests_per_month?.toLocaleString() || '10,000'} requests used
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium">{billing?.billing_tier || 'Free'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Usage</span>
              <span className="font-medium">{billingInfo.currentUsage?.toLocaleString() || '0'} requests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Limit</span>
              <span className="font-medium">{billing?.limits?.requests_per_month?.toLocaleString() || '10,000'} requests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Usage Percentage</span>
              <span className={`font-medium ${billingInfo.percentage > 80 ? 'text-red-600' : 'text-gray-900'}`}>
                {billingInfo.percentage.toFixed(2)}%
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Cost</span>
                <span className="font-medium text-lg">
                  {billingInfo.currency} {billingInfo.estimatedCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Request Trend Chart */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Trend</h3>
          <div className="h-64 flex items-end space-x-2 justify-center">
            {mockChartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="flex flex-col-reverse w-8">
                  <div 
                    className="bg-indigo-500 rounded-t"
                    style={{ height: `${data.successful / 100}px` }}
                  ></div>
                  <div 
                    className="bg-red-500 rounded-t"
                    style={{ height: `${data.failed * 5}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.name}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Successful</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Failed</span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Active Users</span>
                <span className="text-sm text-gray-500">
                  {usage?.active_users || 0} / {billing?.limits?.users || 5}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${usage ? (usage.active_users / (billing?.limits?.users || 5)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">MCP Servers</span>
                <span className="text-sm text-gray-500">
                  {usage?.active_mcp_servers || 0} / {billing?.limits?.mcp_servers || 3}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${usage ? (usage.active_mcp_servers / (billing?.limits?.mcp_servers || 3)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">OAuth Clients</span>
                <span className="text-sm text-gray-500">
                  {usage?.active_oauth_clients || 0} / {billing?.limits?.api_keys || 5}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${usage ? (usage.active_oauth_clients / (billing?.limits?.api_keys || 5)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Storage</span>
                <span className="text-sm text-gray-500">
                  {(usage?.storage_used_bytes ? (usage.storage_used_bytes / 1024 / 1024 / 1024).toFixed(2) : '0')}GB / {billing?.limits?.storage_gb || 1}GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-600 h-2.5 rounded-full" 
                  style={{ width: `${usage ? ((usage.storage_used_bytes || 0) / (billing?.limits?.storage_gb || 1) / 1024 / 1024 / 1024) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Alerts */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Alerts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Triggered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Monthly Requests
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  80% of limit
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {billingInfo.percentage.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    billingInfo.percentage > 80 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {billingInfo.percentage > 80 ? 'Warning' : 'Normal'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2023-06-15
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Storage Usage
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  90% of limit
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(usage?.storage_used_bytes ? (usage.storage_used_bytes / 1024 / 1024 / 1024).toFixed(2) : '0')}GB
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Normal
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2023-06-10
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};