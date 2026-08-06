'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Shield,
  Clock,
  Activity,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  ChevronRight,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  scopes: string[];
  project: {
    name: string;
  } | null;
  isActive: boolean;
  usageCount: number;
  rateLimit: number;
}

export default function ApiKeysPage() {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    scopes: ['mcp:tools:read', 'mcp:resources:read'] as string[],
    rateLimit: 100,
    expiresAt: '',
  });

  // Convex queries and mutations
  const apiKeys = useQuery(api.apiKeys.list, user?.id ? { clerkId: user.id } : 'skip');
  const projects = useQuery(api.projects.list, user?.id ? { clerkId: user.id } : 'skip');
  const createApiKeyMutation = useMutation(api.apiKeys.create);
  const deleteApiKeyMutation = useMutation(api.apiKeys.remove);

  const loading = apiKeys === undefined || projects === undefined;

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      const result = await createApiKeyMutation({
        clerkId: user.id,
        name: formData.name,
        projectId: formData.projectId ? (formData.projectId as any) : undefined,
        scopes: formData.scopes,
        rateLimit: formData.rateLimit,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      });

      // Set the created key to show it to user
      setCreatedKey(result.key);

      toast.success('API key created successfully! Make sure to copy it now.');
      setFormData({
        name: '',
        projectId: '',
        scopes: ['mcp:tools:read', 'mcp:resources:read'],
        rateLimit: 100,
        expiresAt: '',
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!user?.id) return;

    try {
      await deleteApiKeyMutation({ keyId: keyId as any, clerkId: user.id });
      toast.success('API key deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const toggleScope = (scope: string) => {
    setFormData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setFormData({
      name: '',
      projectId: '',
      scopes: ['mcp:tools:read', 'mcp:resources:read'],
      rateLimit: 100,
      expiresAt: '',
    });
  };

  const handleCopyKey = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string, prefix: string) => {
    if (key.length <= prefix.length + 8) return key;
    const visibleEnd = key.slice(-4);
    const maskedPart = '•'.repeat(key.length - prefix.length - 4);
    return `${prefix}${maskedPart}${visibleEnd}`;
  };

  const formatDate = (dateInput: Date | string | null) => {
    if (!dateInput) return 'Never';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'read':
        return 'bg-blue-100 text-blue-700';
      case 'write':
        return 'bg-yellow-100 text-yellow-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-wise-gray-100 text-wise-gray-700';
    }
  };

  const filteredKeys = (apiKeys || []).filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (key.project?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === 'all' ||
                          (filterActive === 'active' && key.isActive) ||
                          (filterActive === 'inactive' && !key.isActive);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>API Keys</h1>
          <p className='text-wise-gray-600 mt-1'>
            Manage your API keys for secure access to the MCP Gateway
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0'
        >
          <Plus className='w-4 h-4 mr-2' />
          Create New Key
        </button>
      </div>

      {/* Security Notice */}
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <div className='flex items-start'>
          <AlertCircle className='w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0' />
          <div className='flex-1'>
            <h3 className='text-sm font-medium text-yellow-900'>Security Best Practices</h3>
            <p className='text-sm text-yellow-700 mt-1'>
              Never share your API keys publicly or commit them to version control. Rotate keys regularly and use environment variables in production.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col md:flex-row md:items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wise-gray-400' />
          <input
            type='text'
            placeholder='Search keys by name or project...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input-wise pl-10'
          />
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setFilterActive('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'all'
                ? 'bg-wise-green-50 text-wise-green-primary'
                : 'text-wise-gray-600 hover:bg-wise-gray-50'
            }`}
          >
            All Keys ({(apiKeys || []).length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'active'
                ? 'bg-wise-green-50 text-wise-green-primary'
                : 'text-wise-gray-600 hover:bg-wise-gray-50'
            }`}
          >
            Active ({(apiKeys || []).filter(k => k.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterActive === 'inactive'
                ? 'bg-wise-green-50 text-wise-green-primary'
                : 'text-wise-gray-600 hover:bg-wise-gray-50'
            }`}
          >
            Inactive ({(apiKeys || []).filter(k => !k.isActive).length})
          </button>
        </div>
      </div>

      {/* API Keys List */}
      <div className='space-y-4'>
        {filteredKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className={`card-wise p-6 ${!apiKey.isActive ? 'opacity-60' : ''}`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center space-x-3'>
                  <h3 className='text-lg font-semibold text-wise-gray-900'>
                    {apiKey.name}
                  </h3>
                  {!apiKey.isActive && (
                    <span className='px-2 py-0.5 bg-wise-gray-200 text-wise-gray-600 text-xs rounded-full font-medium'>
                      Inactive
                    </span>
                  )}
                  {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                    <span className='px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium'>
                      Expired
                    </span>
                  )}
                </div>

                <div className='mt-3 flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <code className='px-3 py-1 bg-wise-gray-100 rounded-lg text-sm font-mono text-wise-gray-700'>
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key, apiKey.prefix)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className='p-1.5 rounded hover:bg-wise-gray-100'
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className='w-4 h-4 text-wise-gray-500' />
                      ) : (
                        <Eye className='w-4 h-4 text-wise-gray-500' />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                      className='p-1.5 rounded hover:bg-wise-gray-100'
                    >
                      {copiedKey === apiKey.id ? (
                        <Check className='w-4 h-4 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-4 h-4 text-wise-gray-500' />
                      )}
                    </button>
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div>
                    <p className='text-xs text-wise-gray-500'>Project</p>
                    <p className='text-sm font-medium text-wise-gray-900 mt-1'>{apiKey.project?.name || 'None'}</p>
                  </div>
                  <div>
                    <p className='text-xs text-wise-gray-500'>Created</p>
                    <p className='text-sm font-medium text-wise-gray-900 mt-1'>
                      {formatDate(apiKey.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-wise-gray-500'>Last Used</p>
                    <p className='text-sm font-medium text-wise-gray-900 mt-1'>
                      {formatDate(apiKey.lastUsedAt)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-wise-gray-500'>Total Requests</p>
                    <p className='text-sm font-medium text-wise-gray-900 mt-1'>
                      {apiKey.usageCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='mt-4 flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Shield className='w-4 h-4 text-wise-gray-400' />
                    <span className='text-xs text-wise-gray-500'>Scopes:</span>
                    <div className='flex items-center space-x-1'>
                      {apiKey.scopes.map((scope) => (
                        <span
                          key={scope}
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${getScopeColor(scope)}`}
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Activity className='w-4 h-4 text-wise-gray-400' />
                    <span className='text-xs text-wise-gray-500'>
                      Rate Limit: {apiKey.rateLimit}/min
                    </span>
                  </div>
                  {apiKey.expiresAt && (
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-4 h-4 text-wise-gray-400' />
                      <span className='text-xs text-wise-gray-500'>
                        Expires: {formatDate(apiKey.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className='relative ml-4'>
                <button className='p-2 rounded-lg hover:bg-wise-gray-50'>
                  <MoreVertical className='w-5 h-5 text-wise-gray-500' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredKeys.length === 0 && (
        <div className='card-wise p-12 text-center'>
          <Key className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>No API keys found</h3>
          <p className='text-wise-gray-600 mb-6'>
            {searchQuery || filterActive !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Create your first API key to get started'}
          </p>
          {!searchQuery && filterActive === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className='btn-wise-primary px-6 py-2 mx-auto'
            >
              <Plus className='w-4 h-4 mr-2' />
              Create Your First Key
            </button>
          )}
        </div>
      )}

      {/* Usage Statistics */}
      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>API Key Usage Summary</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <p className='text-sm text-wise-gray-600'>Total Active Keys</p>
            <p className='text-2xl font-bold text-wise-gray-900 mt-1'>
              {(apiKeys || []).filter(k => k.isActive).length}
            </p>
          </div>
          <div>
            <p className='text-sm text-wise-gray-600'>Total API Calls (30 days)</p>
            <p className='text-2xl font-bold text-wise-gray-900 mt-1'>
              {(apiKeys || []).reduce((sum, key) => sum + key.usageCount, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-sm text-wise-gray-600'>Average Rate Limit</p>
            <p className='text-2xl font-bold text-wise-gray-900 mt-1'>
              {(apiKeys || []).length > 0 ? Math.round((apiKeys || []).reduce((sum, key) => sum + key.rateLimit, 0) / (apiKeys || []).length) : 0}/min
            </p>
          </div>
        </div>
        <div className='mt-4 pt-4 border-t border-wise-gray-200'>
          <button className='text-sm text-wise-green-primary hover:text-wise-green-600 font-medium flex items-center'>
            View Detailed Analytics
            <ChevronRight className='w-4 h-4 ml-1' />
          </button>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-wise-gray-900'>Create New API Key</h2>
              <button
                onClick={closeCreateModal}
                className='p-1 rounded hover:bg-wise-gray-100'
                disabled={saving}
              >
                <X className='w-5 h-5 text-wise-gray-500' />
              </button>
            </div>

            {createdKey ? (
              <div className='space-y-4'>
                <div className='bg-wise-green-50 border border-wise-green-200 rounded-lg p-4'>
                  <div className='flex items-start'>
                    <Info className='w-5 h-5 text-wise-green-600 mt-0.5 mr-3 flex-shrink-0' />
                    <div className='flex-1'>
                      <h3 className='text-sm font-medium text-wise-green-900'>API Key Created Successfully!</h3>
                      <p className='text-sm text-wise-green-700 mt-1'>
                        Make sure to copy your API key now. You won't be able to see it again!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    Your API Key
                  </label>
                  <div className='flex items-center space-x-2'>
                    <code className='flex-1 px-4 py-3 bg-wise-gray-100 rounded-lg text-sm font-mono text-wise-gray-900 break-all'>
                      {createdKey}
                    </code>
                    <button
                      onClick={() => handleCopyKey(createdKey, 'new')}
                      className='p-3 rounded-lg hover:bg-wise-gray-100'
                    >
                      {copiedKey === 'new' ? (
                        <Check className='w-5 h-5 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-5 h-5 text-wise-gray-600' />
                      )}
                    </button>
                  </div>
                </div>

                <div className='flex items-center justify-end pt-4'>
                  <button
                    onClick={closeCreateModal}
                    className='btn-wise-primary px-6 py-2'
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    API Key Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className='input-wise'
                    placeholder='My MCP Gateway Key'
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    Project (Optional)
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className='input-wise'
                    disabled={saving}
                  >
                    <option value=''>None</option>
                    {(projects || []).map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    Scopes *
                  </label>
                  <div className='space-y-2'>
                    {[
                      { value: 'mcp:tools:read', label: 'Read MCP Tools', description: 'View available tools and capabilities' },
                      { value: 'mcp:tools:write', label: 'Execute MCP Tools', description: 'Execute tools and perform actions' },
                      { value: 'mcp:resources:read', label: 'Read MCP Resources', description: 'Access resource data' },
                      { value: 'mcp:resources:write', label: 'Write MCP Resources', description: 'Create and modify resources' },
                    ].map((scope) => (
                      <label
                        key={scope.value}
                        className='flex items-start p-3 border border-wise-gray-200 rounded-lg hover:bg-wise-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.scopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className='mt-1 mr-3'
                          disabled={saving}
                        />
                        <div className='flex-1'>
                          <div className='font-medium text-wise-gray-900'>{scope.label}</div>
                          <div className='text-sm text-wise-gray-600'>{scope.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    Rate Limit (requests per minute)
                  </label>
                  <input
                    type='number'
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: Number(e.target.value) })}
                    className='input-wise'
                    min='1'
                    max='1000'
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                    Expiration Date (Optional)
                  </label>
                  <input
                    type='date'
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className='input-wise'
                    min={new Date().toISOString().split('T')[0]}
                    disabled={saving}
                  />
                </div>

                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-start'>
                    <Info className='w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
                    <div className='flex-1'>
                      <p className='text-sm text-blue-700'>
                        The API key will be shown only once after creation. Make sure to copy and store it securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={closeCreateModal}
                    className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={saving || formData.scopes.length === 0}
                    className='btn-wise-primary px-6 py-2 flex items-center'
                  >
                    {saving ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4 mr-2' />
                        Create API Key
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
