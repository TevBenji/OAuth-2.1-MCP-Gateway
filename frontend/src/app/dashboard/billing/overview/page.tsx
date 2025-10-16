'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  CreditCard,
  Calendar,
  Receipt,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

export default function BillingOverviewPage() {
  const { user } = useUser();
  const overview = useQuery(api.billing.getBillingOverview, user?.id ? { clerkId: user.id } : 'skip');

  const loading = overview === undefined;

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading billing information...</p>
        </div>
      </div>
    );
  }

  const subscription = overview?.subscription;
  const nextBillingDate = subscription?.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString()
    : 'N/A';

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Billing Overview</h1>
        <p className='text-wise-gray-600 mt-1'>Manage your subscription and billing</p>
      </div>

      {/* Unpaid Invoices Alert */}
      {overview?.unpaidInvoices && overview.unpaidInvoices.length > 0 && (
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3'>
          <AlertCircle className='w-5 h-5 text-orange-500 mt-0.5' />
          <div className='flex-1'>
            <h3 className='font-semibold text-orange-900'>Unpaid Invoices</h3>
            <p className='text-sm text-orange-700 mt-1'>
              You have {overview.unpaidInvoices.length} unpaid invoice(s).{' '}
              <Link href='/dashboard/billing/invoice' className='underline font-medium'>
                View invoices
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className='card-wise p-6 bg-gradient-to-r from-wise-green-50 to-wise-green-100/50'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-wise-gray-900'>
              {subscription?.plan || 'Free'} Plan
            </h2>
            <p className='text-wise-gray-600 mt-2'>
              <span className='font-medium'>Status:</span>{' '}
              <span className={subscription?.status === 'ACTIVE' ? 'text-wise-green-primary' : 'text-orange-500'}>
                {subscription?.status || 'Active'}
              </span>
            </p>
            <p className='text-wise-gray-600 mt-1'>
              <span className='font-medium'>Billing Cycle:</span> {subscription?.billingCycle || 'Monthly'}
            </p>
            <p className='text-wise-gray-600 mt-1'>
              <span className='font-medium'>Next Billing Date:</span> {nextBillingDate}
            </p>
          </div>
          <div className='flex flex-col space-y-2'>
            <Link
              href='/dashboard/billing/details'
              className='btn-wise-primary px-6 py-2 text-center'
            >
              Manage Plan
            </Link>
            <Link
              href='/dashboard/billing/recharge'
              className='px-6 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-wise-gray-50 transition-colors text-center'
            >
              Recharge
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatCard
          label='API Call Limit'
          value={(subscription?.apiCallLimit || 0).toLocaleString()}
          icon={TrendingUp}
          color='green'
        />
        <StatCard
          label='Project Limit'
          value={subscription?.projectLimit || 0}
          icon={CheckCircle}
          color='blue'
        />
        <StatCard
          label='Team Members'
          value={subscription?.teamMemberLimit || 0}
          icon={CheckCircle}
          color='purple'
        />
      </div>

      {/* Payment Method */}
      <div className='card-wise p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900'>Payment Method</h2>
          <Link
            href='/dashboard/billing/details'
            className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium'
          >
            Update →
          </Link>
        </div>
        {overview?.paymentMethod ? (
          <div className='flex items-center space-x-4 p-4 bg-wise-gray-50 rounded-lg'>
            <CreditCard className='w-8 h-8 text-wise-gray-600' />
            <div>
              <p className='font-medium text-wise-gray-900'>{overview.paymentMethod}</p>
              <p className='text-sm text-wise-gray-600'>Primary payment method</p>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <CreditCard className='w-12 h-12 text-wise-gray-400 mx-auto mb-3' />
            <p className='text-wise-gray-600 mb-4'>No payment method on file</p>
            <Link
              href='/dashboard/billing/details'
              className='btn-wise-primary px-6 py-2 inline-block'
            >
              Add Payment Method
            </Link>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className='card-wise p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900'>Recent Activity</h2>
          <Link
            href='/dashboard/billing/recharge-details'
            className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium'
          >
            View All →
          </Link>
        </div>
        {overview?.recentPayments && overview.recentPayments.length > 0 ? (
          <div className='space-y-3'>
            {overview.recentPayments.map((payment) => (
              <div
                key={payment._id}
                className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <div className={`p-2 rounded-lg ${
                    payment.status === 'SUCCEEDED' ? 'bg-green-100' :
                    payment.status === 'FAILED' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {payment.status === 'SUCCEEDED' ? (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    ) : payment.status === 'FAILED' ? (
                      <AlertCircle className='w-5 h-5 text-red-600' />
                    ) : (
                      <DollarSign className='w-5 h-5 text-orange-600' />
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-wise-gray-900'>
                      {payment.description || 'Payment'}
                    </p>
                    <p className='text-sm text-wise-gray-600'>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-semibold text-wise-gray-900'>
                    ${(payment.amount / 100).toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    payment.status === 'SUCCEEDED' ? 'text-green-600' :
                    payment.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-wise-gray-500'>
            <Receipt className='w-12 h-12 mx-auto mb-3 opacity-50' />
            <p>No recent activity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Link
          href='/dashboard/billing/invoice'
          className='card-wise p-6 hover:shadow-lg transition-shadow'
        >
          <Receipt className='w-8 h-8 text-wise-green-primary mb-3' />
          <h3 className='font-semibold text-wise-gray-900 mb-1'>Invoices</h3>
          <p className='text-sm text-wise-gray-600'>View and download invoices</p>
        </Link>

        <Link
          href='/dashboard/billing/voucher'
          className='card-wise p-6 hover:shadow-lg transition-shadow'
        >
          <DollarSign className='w-8 h-8 text-wise-green-primary mb-3' />
          <h3 className='font-semibold text-wise-gray-900 mb-1'>Vouchers</h3>
          <p className='text-sm text-wise-gray-600'>Apply discount codes</p>
        </Link>

        <Link
          href='/dashboard/billing/export'
          className='card-wise p-6 hover:shadow-lg transition-shadow'
        >
          <Calendar className='w-8 h-8 text-wise-green-primary mb-3' />
          <h3 className='font-semibold text-wise-gray-900 mb-1'>Export Data</h3>
          <p className='text-sm text-wise-gray-600'>Download billing records</p>
        </Link>
      </div>
    </div>
  );
}
