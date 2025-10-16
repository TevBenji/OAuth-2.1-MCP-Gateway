'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyData {
  name: string;
  description: string;
  scopes: string[];
  expiresAt: string | null;
  rateLimit: number;
  projectId: string | null;
}

export default function NewApiKeyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState<ApiKeyData>({
    name: '',
    description: '',
    scopes: ['mcp:read'],
    expiresAt: null,
    rateLimit: 1000,
    projectId: null,
  });

  // Mock data for demonstration
  const projects = [
    { id: 'proj-1', name: 'MCP Weather Service' },
    { id: 'proj-2', name: 'E-commerce Integration' },
    { id: 'proj-3', name: 'Analytics Dashboard' },
  ];

  const availableScopes = [
    { id: 'mcp:read', label: 'Read Access', description: 'Read MCP server data' },
    { id: 'mcp:write', label: 'Write Access', description: 'Modify MCP server data' },
    { id: 'mcp:admin', label: 'Admin Access', description: 'Full administrative access' },
    { id: 'billing:read', label: 'Billing Read', description: 'Read billing information' },
    { id: 'analytics:read', label: 'Analytics Read', description: 'View analytics data' },
  ];

  const createApiKeyMutation = useMutation(api.apiKeys.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    setLoading(true);
    try {
      // Mock API key creation - in production, this would call your backend
      const mockApiKey = `mcp_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      setApiKey(mockApiKey);
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  const toggleScope = (scope: string) => {
    setFormData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  const handleExpiryChange = (days: number | null) => {
    setFormData(prev => ({
      ...prev,
      expiresAt: days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
    }));
  };

  if (apiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-wise p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-wise-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-wise-green-primary" />
            </div>
            <h1 className="text-2xl font-bold text-wise-gray-900 mb-2">API Key Created Successfully</h1>
            <p className="text-wise-gray-600">
              Your API key has been generated. Please copy it now as it won't be shown again.
            </p>
          </div>

          <div className="bg-wise-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-wise-gray-700">Your API Key</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 hover:bg-wise-gray-200 rounded-lg transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-wise-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-wise-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="p-2 hover:bg-wise-gray-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-wise-gray-600" />
                </button>
              </div>
            </div>
            <div className="font-mono text-sm bg-white p-3 rounded border border-wise-gray-200">
              {showKey ? apiKey : '•••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Security Reminder</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Keep your API key secure and never share it publicly. Store it safely and rotate it regularly.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => copyToClipboard(apiKey)}
              className="btn-wise-primary flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy API Key</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/organization/api-keys')}
              className="btn-wise-secondary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-wise-gray-600 hover:text-wise-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to API Keys
        </button>
      </div>

      <div className="card-wise">
        <div className="p-6 border-b border-wise-gray-200">
          <h1 className="text-2xl font-bold text-wise-gray-900">Create New API Key</h1>
          <p className="text-wise-gray-600 mt-1">
            Generate a new API key for authenticating with MCP servers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-wise-gray-700 mb-2">
                  Key Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-wise"
                  placeholder="e.g., Production API Key"
                  required
                />
                <p className="text-xs text-wise-gray-500 mt-1">
                  A descriptive name to help you identify this key
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-wise-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-wise min-h-[80px] resize-y"
                  placeholder="Optional description of what this key is used for"
                />
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900 mb-4">Project</h3>
            <select
              value={formData.projectId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value || null }))}
              className="input-wise"
            >
              <option value="">No specific project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-wise-gray-500 mt-1">
              Optional: Associate this key with a specific project
            </p>
          </div>

          {/* Scopes */}
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900 mb-4">Permissions (Scopes)</h3>
            <div className="space-y-3">
              {availableScopes.map(scope => (
                <label key={scope.id} className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.scopes.includes(scope.id)}
                    onChange={() => toggleScope(scope.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-wise-gray-900">{scope.label}</div>
                    <div className="text-sm text-wise-gray-600">{scope.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Limit */}
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900 mb-4">Rate Limit</h3>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={formData.rateLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 1000 }))}
                className="input-wise w-32"
                min="1"
                max="10000"
              />
              <span className="text-wise-gray-600">requests per hour</span>
            </div>
            <p className="text-xs text-wise-gray-500 mt-1">
              Maximum number of requests this key can make per hour
            </p>
          </div>

          {/* Expiry */}
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900 mb-4">Expiry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleExpiryChange(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.expiresAt === null
                    ? 'bg-wise-green-primary text-white'
                    : 'bg-wise-gray-100 text-wise-gray-700 hover:bg-wise-gray-200'
                }`}
              >
                Never
              </button>
              <button
                type="button"
                onClick={() => handleExpiryChange(30)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.expiresAt && new Date(formData.expiresAt).getTime() - Date.now() <= 31 * 24 * 60 * 60 * 1000
                    ? 'bg-wise-green-primary text-white'
                    : 'bg-wise-gray-100 text-wise-gray-700 hover:bg-wise-gray-200'
                }`}
              >
                30 days
              </button>
              <button
                type="button"
                onClick={() => handleExpiryChange(90)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.expiresAt && new Date(formData.expiresAt).getTime() - Date.now() <= 91 * 24 * 60 * 60 * 1000
                    ? 'bg-wise-green-primary text-white'
                    : 'bg-wise-gray-100 text-wise-gray-700 hover:bg-wise-gray-200'
                }`}
              >
                90 days
              </button>
              <button
                type="button"
                onClick={() => handleExpiryChange(365)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.expiresAt && new Date(formData.expiresAt).getTime() - Date.now() <= 366 * 24 * 60 * 60 * 1000
                    ? 'bg-wise-green-primary text-white'
                    : 'bg-wise-gray-100 text-wise-gray-700 hover:bg-wise-gray-200'
                }`}
              >
                1 year
              </button>
            </div>
            <p className="text-xs text-wise-gray-500 mt-1">
              Choose when this API key should expire
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-wise-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/organization/api-keys')}
              className="btn-wise-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn-wise-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create API Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
