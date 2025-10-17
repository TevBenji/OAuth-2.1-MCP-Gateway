'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
} from 'lucide-react';

type InvoiceStatus = 'PAID' | 'OPEN' | 'DRAFT' | 'VOID' | 'UNCOLLECTIBLE';

export default function InvoicePage() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<'30' | '90' | '365' | 'all'>('all');

  const invoices = useQuery(api.billing.getInvoices, user?.id ? { clerkId: user.id } : 'skip');

  const loading = invoices === undefined;

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'OPEN':
        return 'bg-blue-100 text-blue-700';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'VOID':
        return 'bg-red-100 text-red-700';
      case 'UNCOLLECTIBLE':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className='w-4 h-4' />;
      case 'OPEN':
        return <Clock className='w-4 h-4' />;
      case 'DRAFT':
        return <FileText className='w-4 h-4' />;
      case 'VOID':
      case 'UNCOLLECTIBLE':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <FileText className='w-4 h-4' />;
    }
  };

  const filterInvoices = () => {
    if (!invoices) return [];

    let filtered = [...invoices];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((invoice) => new Date(invoice.createdAt) >= cutoffDate);
    }

    return filtered;
  };

  const filteredInvoices = filterInvoices();

  const handleDownloadInvoice = (invoiceId: string, invoiceNumber: string) => {
    // In production, this would fetch the PDF from Stripe or generate it
    console.log('Downloading invoice:', invoiceId);
    // For now, we'll just show a message
    alert(`Downloading invoice ${invoiceNumber}. In production, this would fetch the PDF from Stripe.`);
  };

  const handleViewInvoice = (invoiceId: string, invoiceNumber: string) => {
    // In production, this would open the invoice in a modal or new tab
    console.log('Viewing invoice:', invoiceId);
    alert(`Viewing invoice ${invoiceNumber}. In production, this would show invoice details.`);
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Invoices</h1>
          <p className='text-wise-gray-600 mt-1'>
            View and download your billing invoices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-4'>
          <Filter className='w-5 h-5 text-wise-gray-400' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Filters</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
              className='input-wise'
            >
              <option value='ALL'>All Statuses</option>
              <option value='PAID'>Paid</option>
              <option value='OPEN'>Open</option>
              <option value='DRAFT'>Draft</option>
              <option value='VOID'>Void</option>
              <option value='UNCOLLECTIBLE'>Uncollectible</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '30' | '90' | '365' | 'all')}
              className='input-wise'
            >
              <option value='all'>All Time</option>
              <option value='30'>Last 30 Days</option>
              <option value='90'>Last 90 Days</option>
              <option value='365'>Last Year</option>
            </select>
          </div>
        </div>

        {filteredInvoices.length !== invoices?.length && (
          <p className='text-sm text-wise-gray-600 mt-4'>
            Showing {filteredInvoices.length} of {invoices?.length || 0} invoices
          </p>
        )}
      </div>

      {/* Invoice List */}
      {filteredInvoices && filteredInvoices.length > 0 ? (
        <div className='card-wise p-6'>
          <div className='space-y-4'>
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice._id}
                className='flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-wise-gray-50 rounded-lg hover:bg-wise-gray-100 transition-colors'
              >
                <div className='flex items-start space-x-4 mb-4 md:mb-0'>
                  <div className='p-3 bg-white rounded-lg'>
                    <FileText className='w-6 h-6 text-wise-green-primary' />
                  </div>
                  <div>
                    <div className='flex items-center space-x-2 mb-1'>
                      <h3 className='font-semibold text-wise-gray-900'>
                        Invoice #{invoice.invoiceNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status}</span>
                      </span>
                    </div>
                    <div className='space-y-1'>
                      <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          Issued: {new Date(invoice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {invoice.dueDate && (
                        <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                          <Clock className='w-4 h-4' />
                          <span>
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                        <span>
                          Period: {new Date(invoice.billingPeriodStart).toLocaleDateString()} - {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='text-right'>
                    <div className='flex items-center space-x-1 text-2xl font-bold text-wise-gray-900'>
                      <DollarSign className='w-5 h-5' />
                      <span>{(invoice.total / 100).toFixed(2)}</span>
                    </div>
                    {invoice.status === 'PAID' && invoice.paidAt && (
                      <p className='text-xs text-green-600 mt-1'>
                        Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className='flex flex-col space-y-2'>
                    <button
                      onClick={() => handleViewInvoice(invoice._id, invoice.invoiceNumber)}
                      className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-white transition-colors flex items-center space-x-2'
                    >
                      <Eye className='w-4 h-4' />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice._id, invoice.invoiceNumber)}
                      className='px-4 py-2 bg-wise-green-primary text-white rounded-lg hover:bg-wise-green-600 transition-colors flex items-center space-x-2'
                    >
                      <Download className='w-4 h-4' />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={statusFilter === 'ALL' ? 'No invoices yet' : `No ${statusFilter.toLowerCase()} invoices`}
          description={
            statusFilter === 'ALL'
              ? 'Your billing invoices will appear here'
              : `You don't have any ${statusFilter.toLowerCase()} invoices in the selected date range`
          }
        />
      )}

      {/* Summary Stats */}
      {invoices && invoices.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='card-wise p-4'>
            <p className='text-sm text-wise-gray-600 mb-1'>Total Invoices</p>
            <p className='text-2xl font-bold text-wise-gray-900'>{invoices.length}</p>
          </div>
          <div className='card-wise p-4'>
            <p className='text-sm text-wise-gray-600 mb-1'>Paid</p>
            <p className='text-2xl font-bold text-green-600'>
              {invoices.filter((i) => i.status === 'PAID').length}
            </p>
          </div>
          <div className='card-wise p-4'>
            <p className='text-sm text-wise-gray-600 mb-1'>Open</p>
            <p className='text-2xl font-bold text-blue-600'>
              {invoices.filter((i) => i.status === 'OPEN').length}
            </p>
          </div>
          <div className='card-wise p-4'>
            <p className='text-sm text-wise-gray-600 mb-1'>Uncollectible</p>
            <p className='text-2xl font-bold text-red-600'>
              {invoices.filter((i) => i.status === 'UNCOLLECTIBLE').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
