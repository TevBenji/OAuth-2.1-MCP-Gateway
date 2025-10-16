'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  Image,
  FileCode,
  Archive,
  Search,
  Filter,
  Calendar,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FilesPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  const files = useQuery(api.files.getFiles, user?.id ? { clerkId: user.id } : 'skip');
  const createFileMetadataMutation = useMutation(api.files.createFileMetadata);
  const deleteFileMutation = useMutation(api.files.deleteFile);

  const loading = files === undefined;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !e.target.files?.[0]) return;

    const file = e.target.files[0];

    try {
      setUploading(true);

      // In production, this would upload to Convex storage
      // For now, create metadata record
      await createFileMetadataMutation({
        clerkId: user.id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        storageId: `storage_${Date.now()}_${file.name}`, // Placeholder storage ID
      });

      toast.success(`File "${file.name}" uploaded successfully`);
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!user?.id) return;
    if (!confirm(`Delete "${fileName}"? This action cannot be undone.`)) return;

    try {
      await deleteFileMutation({
        clerkId: user.id,
        fileId,
      });
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleDownloadFile = (file: any) => {
    // In production, this would fetch from Convex storage
    console.log('Downloading file:', file.storageId);
    toast.info('File download would start here. In production, this fetches from Convex storage.');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className='w-6 h-6' />;
    if (fileType.includes('pdf')) return <FileText className='w-6 h-6' />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className='w-6 h-6' />;
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('json'))
      return <FileCode className='w-6 h-6' />;
    return <File className='w-6 h-6' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filterFiles = () => {
    if (!files) return [];

    let filtered = [...files];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by file type
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter((file) => file.type.startsWith(fileTypeFilter));
    }

    return filtered;
  };

  const filteredFiles = filterFiles();

  const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0;

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Files</h1>
          <p className='text-wise-gray-600 mt-1'>
            Upload and manage your files
          </p>
        </div>
        <label className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0 cursor-pointer'>
          {uploading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Uploading...
            </>
          ) : (
            <>
              <Upload className='w-4 h-4 mr-2' />
              Upload File
            </>
          )}
          <input
            type='file'
            onChange={handleFileUpload}
            className='hidden'
            disabled={uploading}
          />
        </label>
      </div>

      {/* Storage Stats */}
      {files && files.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='card-wise p-6'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-sm text-wise-gray-600'>Total Files</p>
              <FileText className='w-5 h-5 text-wise-gray-400' />
            </div>
            <p className='text-2xl font-bold text-wise-gray-900'>{files.length}</p>
          </div>
          <div className='card-wise p-6'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-sm text-wise-gray-600'>Storage Used</p>
              <HardDrive className='w-5 h-5 text-wise-gray-400' />
            </div>
            <p className='text-2xl font-bold text-wise-gray-900'>{formatFileSize(totalSize)}</p>
          </div>
          <div className='card-wise p-6'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-sm text-wise-gray-600'>Storage Limit</p>
              <HardDrive className='w-5 h-5 text-wise-gray-400' />
            </div>
            <p className='text-2xl font-bold text-wise-gray-900'>10 GB</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {files && files.length > 0 && (
        <div className='card-wise p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wise-gray-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='input-wise pl-10'
                placeholder='Search files...'
              />
            </div>
            <div className='relative'>
              <Filter className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wise-gray-400' />
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className='input-wise pl-10'
              >
                <option value='all'>All File Types</option>
                <option value='image'>Images</option>
                <option value='application/pdf'>PDF Documents</option>
                <option value='text'>Text Files</option>
                <option value='application'>Applications</option>
              </select>
            </div>
          </div>
          {filteredFiles.length !== files.length && (
            <p className='text-sm text-wise-gray-600 mt-4'>
              Showing {filteredFiles.length} of {files.length} files
            </p>
          )}
        </div>
      )}

      {/* Files List */}
      {filteredFiles && filteredFiles.length > 0 ? (
        <div className='grid grid-cols-1 gap-4'>
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className='card-wise p-6 hover:shadow-lg transition-shadow'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4 flex-1'>
                  <div className='p-3 bg-wise-gray-100 rounded-lg text-wise-gray-600'>
                    {getFileIcon(file.type)}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-wise-gray-900 mb-1'>
                      {file.name}
                    </h3>
                    <div className='flex items-center space-x-4 text-sm text-wise-gray-600'>
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span className='text-xs bg-wise-gray-100 px-2 py-1 rounded'>
                        {file.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-3'>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-wise-gray-50 transition-colors flex items-center'
                  >
                    <Download className='w-4 h-4 mr-2' />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file._id, file.name)}
                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-5 h-5' />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={searchQuery || fileTypeFilter !== 'all' ? 'No files match your filters' : 'No files uploaded yet'}
          description={searchQuery || fileTypeFilter !== 'all' ? 'Try adjusting your search or filters' : 'Upload files to get started'}
          action={!searchQuery && fileTypeFilter === 'all' ? {
            label: 'Upload File',
            onClick: () => document.querySelector('input[type="file"]')?.click(),
          } : undefined}
        />
      )}
    </div>
  );
}
