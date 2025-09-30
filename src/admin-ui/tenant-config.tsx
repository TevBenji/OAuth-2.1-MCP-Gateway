import { FC, useState } from 'react';
import { TenantConfig } from '../../types/tenant';

export interface TenantConfigFormProps {
  initialConfig?: Partial<TenantConfig>;
  onSave?: (config: TenantConfig) => void;
}

export const TenantConfigForm: FC<TenantConfigFormProps> = ({ 
  initialConfig, 
  onSave 
}) => {
  const [config, setConfig] = useState<TenantConfig>({
    tenant_id: initialConfig?.tenant_id || '',
    name: initialConfig?.name || '',
    domain: initialConfig?.domain || '',
    status: initialConfig?.status || 'active',
    compliance_tier: initialConfig?.compliance_tier || 'standard',
    audit_retention_days: initialConfig?.audit_retention_days || 365,
    encryption_at_rest: initialConfig?.encryption_at_rest || true,
    max_users: initialConfig?.max_users || 100,
    max_mcp_servers: initialConfig?.max_mcp_servers || 10,
    max_oauth_clients: initialConfig?.max_oauth_clients || 50,
    max_requests_per_month: initialConfig?.max_requests_per_month || 10000,
    max_concurrent_sessions: initialConfig?.max_concurrent_sessions || 100,
    rate_limits: initialConfig?.rate_limits || {
      requests_per_minute: 1000,
      requests_per_hour: 10000,
      requests_per_day: 100000,
      burst_limit: 100
    },
    billing_tier: initialConfig?.billing_tier || 'free',
    billing_email: initialConfig?.billing_email || '',
    billing_address: initialConfig?.billing_address,
    features: initialConfig?.features || {
      api_key_rotation: true,
      advanced_audit_logging: false,
      custom_scopes: false,
      sso_integration: false,
      dedicated_support: false
    },
    metadata: initialConfig?.metadata,
    created_at: initialConfig?.created_at,
    updated_at: initialConfig?.updated_at
  });

  const handleChange = (field: keyof TenantConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRateLimitChange = (field: keyof TenantConfig['rate_limits'], value: number) => {
    setConfig(prev => ({
      ...prev,
      rate_limits: {
        ...prev.rate_limits,
        [field]: value
      }
    }));
  };

  const handleFeatureChange = (feature: keyof TenantConfig['features'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(config);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Tenant Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain</label>
              <input
                type="text"
                value={config.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={config.status}
                onChange={(e) => handleChange('status', e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Compliance Tier</label>
              <select
                value={config.compliance_tier}
                onChange={(e) => handleChange('compliance_tier', e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="standard">Standard</option>
                <option value="hipaa">HIPAA</option>
                <option value="pci-dss">PCI-DSS</option>
                <option value="sox">SOX</option>
              </select>
            </div>
          </div>
          
          {/* Limits */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-700">Limits</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Users</label>
              <input
                type="number"
                value={config.max_users}
                onChange={(e) => handleChange('max_users', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max MCP Servers</label>
              <input
                type="number"
                value={config.max_mcp_servers}
                onChange={(e) => handleChange('max_mcp_servers', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max OAuth Clients</label>
              <input
                type="number"
                value={config.max_oauth_clients}
                onChange={(e) => handleChange('max_oauth_clients', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Requests per Month</label>
              <input
                type="number"
                value={config.max_requests_per_month}
                onChange={(e) => handleChange('max_requests_per_month', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Rate Limits */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Rate Limits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Per Minute</label>
              <input
                type="number"
                value={config.rate_limits.requests_per_minute}
                onChange={(e) => handleRateLimitChange('requests_per_minute', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Per Hour</label>
              <input
                type="number"
                value={config.rate_limits.requests_per_hour}
                onChange={(e) => handleRateLimitChange('requests_per_hour', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Per Day</label>
              <input
                type="number"
                value={config.rate_limits.requests_per_day}
                onChange={(e) => handleRateLimitChange('requests_per_day', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Burst Limit</label>
              <input
                type="number"
                value={config.rate_limits.burst_limit}
                onChange={(e) => handleRateLimitChange('burst_limit', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Billing */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Billing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Billing Tier</label>
              <select
                value={config.billing_tier}
                onChange={(e) => handleChange('billing_tier', e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Billing Email</label>
              <input
                type="email"
                value={config.billing_email}
                onChange={(e) => handleChange('billing_email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                id="api-key-rotation"
                type="checkbox"
                checked={config.features.api_key_rotation}
                onChange={(e) => handleFeatureChange('api_key_rotation', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="api-key-rotation" className="ml-2 block text-sm text-gray-900">
                API Key Rotation
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="advanced-audit-logging"
                type="checkbox"
                checked={config.features.advanced_audit_logging}
                onChange={(e) => handleFeatureChange('advanced_audit_logging', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="advanced-audit-logging" className="ml-2 block text-sm text-gray-900">
                Advanced Audit Logging
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="custom-scopes"
                type="checkbox"
                checked={config.features.custom_scopes}
                onChange={(e) => handleFeatureChange('custom_scopes', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="custom-scopes" className="ml-2 block text-sm text-gray-900">
                Custom Scopes
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="sso-integration"
                type="checkbox"
                checked={config.features.sso_integration}
                onChange={(e) => handleFeatureChange('sso_integration', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="sso-integration" className="ml-2 block text-sm text-gray-900">
                SSO Integration
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="dedicated-support"
                type="checkbox"
                checked={config.features.dedicated_support}
                onChange={(e) => handleFeatureChange('dedicated_support', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="dedicated-support" className="ml-2 block text-sm text-gray-900">
                Dedicated Support
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};