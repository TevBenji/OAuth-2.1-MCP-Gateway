'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Download,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

type ExportType = 'INVOICES' | 'PAYMENTS' | 'USAGE' | 'ALL';
type ExportFormat = 'CSV' | 'JSON' | 'PDF';
type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export default function ExportPage() {
  const { user } = useUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('ALL');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('CSV');
  const [creating, setCreating] = useState(false);

  const exports = useQuery(api.exports.getExportRecords, user?.id ? { clerkId: user.id } : 'skip');
  const createExportMutation = useMutation(api.exports.createExport);
  const deleteExportMutation = useMutation(api.exports.deleteExport);

  const loading = exports === undefined;

  const handleCreateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setCreating(true);
      await createExportMutation({
        clerkId: user.id,
        exportType,
        format: exportFormat,
      });
      toast.success('Export created successfully! Processing will begin shortly.');
      setShowCreateForm(false);
      setExportType('ALL');
      setExportFormat('CSV');
    } catch (error) {
      console.error('Error creating export:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create export');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    if (!user?.id) return;
    if (!confirm('Delete this export? This action cannot be undone.')) return;

    try {
      await deleteExportMutation({
        clerkId: user.id,
        exportId,
      });
      toast.success('Export deleted successfully');
    } catch (error) {
      console.error('Error deleting export:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete export');
    }
  };

  const handleDownloadExport = (exportRecord: any) => {
    if (exportRecord.status !== 'COMPLETED' || !exportRecord.downloadUrl) {
      toast.error('Export is not ready for download');
      return;
    }

    // In production, this would download from the actual URL
    console.log('Downloading export:', exportRecord.downloadUrl);
    toast.success('Download started. In production, this would download the file.');
  };

  const getStatusIcon = (status: ExportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'PROCESSING':
      case 'PENDING':
        return <Clock className='w-5 h-5 text-blue-600' />;
      case 'FAILED':
        return <XCircle className='w-5 h-5 text-red-600' />;
      case 'EXPIRED':
        return <AlertCircle className='w-5 h-5 text-orange-600' />;
      default:
        return <Clock className='w-5 h-5 text-gray-600' />;
    }
  };

  const getStatusColor = (status: ExportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
      case 'PENDING':
        return 'bg-blue-100 text-blue-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getExpiryInfo = (expiresAt: number) => {
    const now = Date.now();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600' };
    if (daysLeft === 0) return { text: 'Expires today', color: 'text-orange-600' };
    if (daysLeft === 1) return { text: 'Expires tomorrow', color: 'text-orange-600' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: 'text-orange-600' };
    return { text: `${daysLeft} days left`, color: 'text-wise-gray-600' };
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading export records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Export Records</h1>
          <p className='text-wise-gray-600 mt-1'>
            Download your billing data in various formats
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0'
        >
          <Download className='w-4 h-4 mr-2' />
          Create Export
        </button>
      </div>

      {/* Create Export Form */}
      {showCreateForm && (
        <div className='card-wise p-6'>
          <form onSubmit={handleCreateExport} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Data Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className='input-wise'
                >
                  <option value='ALL'>All Billing Data</option>
                  <option value='INVOICES'>Invoices Only</option>
                  <option value='PAYMENTS'>Payments Only</option>
                  <option value='USAGE'>Usage Records Only</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className='input-wise'
                >
                  <option value='CSV'>CSV (Spreadsheet)</option>
                  <option value='JSON'>JSON (Developer)</option>
                  <option value='PDF'>PDF (Document)</option>
                </select>
              </div>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3'>
              <AlertCircle className='w-5 h-5 text-blue-500 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm text-blue-700'>
                  Export will be available for download for 30 days. Processing may take a few minutes for large datasets.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end space-x-3'>
              <button
                type='button'
                onClick={() => setShowCreateForm(false)}
                className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={creating}
                className='btn-wise-primary px-6 py-2 flex items-center'
              >
                {creating ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className='w-4 h-4 mr-2' />
                    Create Export
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Export List */}
      {exports && exports.length > 0 ? (
        <div className='space-y-4'>
          {exports.map((exportRecord) => {
            const expiryInfo = exportRecord.expiresAt ? getExpiryInfo(exportRecord.expiresAt) : null;

            return (
              <div
                key={exportRecord._id}
                className='card-wise p-6'
              >
                <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
                  <div className='flex items-start space-x-4 mb-4 md:mb-0'>
                    <div className='p-3 bg-wise-gray-100 rounded-lg'>
                      <FileText className='w-6 h-6 text-wise-gray-600' />
                    </div>
                    <div>
                      <div className='flex items-center space-x-2 mb-2'>
                        <h3 className='font-semibold text-wise-gray-900'>
                          {exportRecord.exportType.replace('_', ' ')} - {exportRecord.format}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(exportRecord.status)}`}>
                          {getStatusIcon(exportRecord.status)}
                          <span>{exportRecord.status}</span>
                        </span>
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                          <Calendar className='w-4 h-4' />
                          <span>
                            Created: {new Date(exportRecord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {exportRecord.completedAt && (
                          <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                            <CheckCircle className='w-4 h-4' />
                            <span>
                              Completed: {new Date(exportRecord.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {expiryInfo && exportRecord.status === 'COMPLETED' && (
                          <div className='flex items-center space-x-2 text-sm'>
                            <Clock className='w-4 h-4' />
                            <span className={expiryInfo.color}>{expiryInfo.text}</span>
                          </div>
                        )}
                        {exportRecord.error && (
                          <p className='text-sm text-red-600 mt-1'>
                            Error: {exportRecord.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    {exportRecord.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDownloadExport(exportRecord)}
                        className='btn-wise-primary px-4 py-2 flex items-center'
                      >
                        <Download className='w-4 h-4 mr-2' />
                        Download
                      </button>
                    )}
                    {(exportRecord.status === 'COMPLETED' || exportRecord.status === 'FAILED' || exportRecord.status === 'EXPIRED') && (
                      <button
                        onClick={() => handleDeleteExport(exportRecord._id)}
                        className='px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center'
                      >
                        <Trash2 className='w-4 h-4 mr-2' />
                        Delete
                      </button>
                    )}
                    {(exportRecord.status === 'PENDING' || exportRecord.status === 'PROCESSING') && (
                      <div className='flex items-center space-x-2 text-wise-gray-600'>
                        <Loader2 className='w-5 h-5 animate-spin' />
                        <span className='text-sm'>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Download}
          title='No export records'
          description='Create an export to download your billing data'
          action={{
            label: 'Create Export',
            onClick: () => setShowCreateForm(true),
          }}
        />
      )}

      {/* Info Panel */}
      <div className='card-wise p-6 bg-wise-gray-50'>
        <h3 className='font-medium text-wise-gray-900 mb-3'>Export Information</h3>
        <div className='space-y-2 text-sm text-wise-gray-600'>
          <p>• Export files are available for download for 30 days</p>
          <p>• Large datasets may take several minutes to process</p>
          <p>• CSV format is ideal for spreadsheet applications</p>
          <p>• JSON format is ideal for developers and custom integrations</p>
          <p>• PDF format is ideal for archival and reporting</p>
        </div>
      </div>
    </div>
  );
}
