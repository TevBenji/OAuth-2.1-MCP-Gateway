'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

type PaymentStatus = 'SUCCEEDED' | 'PENDING' | 'FAILED';

export default function RechargeDetailsPage() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [limit, setLimit] = useState(20);

  const payments = useQuery(
    api.billing.getPaymentHistory,
    user?.id ? { clerkId: user.id, limit } : 'skip'
  );

  const loading = payments === undefined;

  const filterPayments = () => {
    if (!payments) return [];

    let filtered = [...payments];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((payment) => new Date(payment.createdAt) >= cutoffDate);
    }

    return filtered;
  };

  const filteredPayments = filterPayments();

  const calculateStats = () => {
    if (!filteredPayments.length) {
      return {
        totalAmount: 0,
        successCount: 0,
        failedCount: 0,
        avgAmount: 0,
      };
    }

    const totalAmount = filteredPayments.reduce((sum, p) => {
      if (p.status === 'SUCCEEDED') return sum + p.amount;
      return sum;
    }, 0);

    const successCount = filteredPayments.filter((p) => p.status === 'SUCCEEDED').length;
    const failedCount = filteredPayments.filter((p) => p.status === 'FAILED').length;
    const avgAmount = successCount > 0 ? totalAmount / successCount : 0;

    return { totalAmount, successCount, failedCount, avgAmount };
  };

  const stats = calculateStats();

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      alert('No transactions to export');
      return;
    }

    // In production, generate and download CSV
    console.log('Exporting CSV for', filteredPayments.length, 'transactions');
    alert(`Exporting ${filteredPayments.length} transactions to CSV. In production, this would download a CSV file.`);
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'PENDING':
        return <Clock className='w-5 h-5 text-orange-600' />;
      case 'FAILED':
        return <AlertCircle className='w-5 h-5 text-red-600' />;
      default:
        return <Clock className='w-5 h-5 text-gray-600' />;
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-orange-100 text-orange-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Recharge Details</h1>
          <p className='text-wise-gray-600 mt-1'>
            Complete transaction history and analytics
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-wise-gray-50 transition-colors flex items-center mt-4 md:mt-0'
        >
          <Download className='w-4 h-4 mr-2' />
          Export CSV
        </button>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-wise-gray-600'>Total Recharged</p>
            <TrendingUp className='w-5 h-5 text-wise-green-primary' />
          </div>
          <p className='text-2xl font-bold text-wise-gray-900'>
            ${(stats.totalAmount / 100).toFixed(2)}
          </p>
          <p className='text-xs text-wise-gray-500 mt-1'>
            {dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}
          </p>
        </div>

        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-wise-gray-600'>Successful</p>
            <CheckCircle className='w-5 h-5 text-green-600' />
          </div>
          <p className='text-2xl font-bold text-green-600'>{stats.successCount}</p>
          <p className='text-xs text-wise-gray-500 mt-1'>Completed transactions</p>
        </div>

        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-wise-gray-600'>Failed</p>
            <AlertCircle className='w-5 h-5 text-red-600' />
          </div>
          <p className='text-2xl font-bold text-red-600'>{stats.failedCount}</p>
          <p className='text-xs text-wise-gray-500 mt-1'>Failed transactions</p>
        </div>

        <div className='card-wise p-6'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-wise-gray-600'>Average Amount</p>
            <DollarSign className='w-5 h-5 text-wise-gray-400' />
          </div>
          <p className='text-2xl font-bold text-wise-gray-900'>
            ${(stats.avgAmount / 100).toFixed(2)}
          </p>
          <p className='text-xs text-wise-gray-500 mt-1'>Per transaction</p>
        </div>
      </div>

      {/* Filters */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-4'>
          <Filter className='w-5 h-5 text-wise-gray-400' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Filters</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
              className='input-wise'
            >
              <option value='ALL'>All Statuses</option>
              <option value='SUCCEEDED'>Succeeded</option>
              <option value='PENDING'>Pending</option>
              <option value='FAILED'>Failed</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90' | 'all')}
              className='input-wise'
            >
              <option value='all'>All Time</option>
              <option value='7'>Last 7 Days</option>
              <option value='30'>Last 30 Days</option>
              <option value='90'>Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Results Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className='input-wise'
            >
              <option value='10'>10</option>
              <option value='20'>20</option>
              <option value='50'>50</option>
              <option value='100'>100</option>
            </select>
          </div>
        </div>

        {filteredPayments.length !== payments?.length && (
          <p className='text-sm text-wise-gray-600 mt-4'>
            Showing {filteredPayments.length} of {payments?.length || 0} transactions
          </p>
        )}
      </div>

      {/* Transaction List */}
      {filteredPayments && filteredPayments.length > 0 ? (
        <div className='card-wise p-6'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-wise-gray-200'>
                  <th className='text-left py-3 px-4 text-sm font-semibold text-wise-gray-700'>
                    Date & Time
                  </th>
                  <th className='text-left py-3 px-4 text-sm font-semibold text-wise-gray-700'>
                    Description
                  </th>
                  <th className='text-left py-3 px-4 text-sm font-semibold text-wise-gray-700'>
                    Status
                  </th>
                  <th className='text-right py-3 px-4 text-sm font-semibold text-wise-gray-700'>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr
                    key={payment._id}
                    className={`border-b border-wise-gray-100 hover:bg-wise-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-wise-gray-50/50'
                    }`}
                  >
                    <td className='py-4 px-4'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 text-wise-gray-400' />
                        <div>
                          <p className='text-sm font-medium text-wise-gray-900'>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                          <p className='text-xs text-wise-gray-500'>
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-4'>
                      <p className='text-sm text-wise-gray-900'>
                        {payment.description || 'Account recharge'}
                      </p>
                    </td>
                    <td className='py-4 px-4'>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className='ml-1'>{payment.status}</span>
                      </span>
                    </td>
                    <td className='py-4 px-4 text-right'>
                      <p className={`text-sm font-semibold ${
                        payment.status === 'SUCCEEDED' ? 'text-green-600' :
                        payment.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title={statusFilter === 'ALL' ? 'No transactions yet' : `No ${statusFilter.toLowerCase()} transactions`}
          description={
            statusFilter === 'ALL'
              ? 'Your recharge transactions will appear here'
              : `You don't have any ${statusFilter.toLowerCase()} transactions in the selected date range`
          }
        />
      )}
    </div>
  );
}
