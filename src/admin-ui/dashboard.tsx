import { FC, useState, useEffect } from 'react';
import { Tenant } from '../types/tenant';
import { UsageMetrics } from '../types/usage';
import { AuditLog } from '../types/audit';
import { TenantConfigForm } from './tenant-config';
import { TenantList } from './tenant-list';
import { ClientManagement } from './client-management';
import { AuditLogViewer } from './audit-log-viewer';
import { UsageAnalytics } from './usage-analytics';

export interface AdminDashboardProps {
  onLogout?: () => void;
}

export const AdminDashboard: FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Simulating data loading - in a real app, this would be API calls
  useEffect(() => {
    // Load tenant data
    const mockTenants: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'Acme Corp',
        description: 'Acme Corporation tenant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        compliance_tier: 'enterprise',
        limits: {
          max_clients: 100,
          max_tokens_per_hour: 10000,
          max_requests_per_minute: 1000,
          max_mcp_servers: 50,
          max_users: 1000,
        },
        status: 'active',
        settings: {
          enable_audit_logging: true,
          enable_session_management: true,
          enable_rate_limiting: true,
          allow_custom_scopes: true,
          require_mfa: true,
        }
      },
      {
        id: 'tenant-2',
        name: 'Globex Inc',
        description: 'Globex Incorporated tenant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        compliance_tier: 'standard',
        limits: {
          max_clients: 50,
          max_tokens_per_hour: 5000,
          max_requests_per_minute: 500,
          max_mcp_servers: 20,
          max_users: 500,
        },
        status: 'active',
        settings: {
          enable_audit_logging: true,
          enable_session_management: true,
          enable_rate_limiting: true,
          allow_custom_scopes: false,
          require_mfa: false,
        }
      }
    ];
    setTenants(mockTenants);
    
    // Load mock usage metrics
    const mockUsageMetrics: UsageMetrics = {
      tenant_id: 'tenant-1',
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      total_requests: 85000,
      successful_requests: 84500,
      failed_requests: 500,
      average_response_time_ms: 120,
      active_users: 250,
      active_mcp_servers: 8,
      active_oauth_clients: 15,
      storage_used_bytes: 250000000,
      billable_requests: 85000,
      overage_requests: 0,
      estimated_cost: 299.00,
    };
    setUsageMetrics(mockUsageMetrics);
    
    // Load mock audit logs
    const mockAuditLogs: AuditLog[] = [
      {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        user_id: 'user-1',
        client_id: 'client-1',
        action: 'tenant_created',
        resource_type: 'tenant',
        resource_id: 'tenant-1',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        success: true,
        details: { name: 'Acme Corp' },
        compliance_tags: ['PCI-DSS', 'SOC2'],
        tenant_id: 'tenant-1'
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user_id: 'user-2',
        client_id: 'client-2',
        action: 'token_issued',
        resource_type: 'token',
        resource_id: 'token-1',
        ip_address: '192.168.1.2',
        user_agent: 'Mozilla/5.0...',
        success: true,
        details: { scope: 'mcp:read' },
        compliance_tags: ['SOC2'],
        tenant_id: 'tenant-2'
      }
    ];
    setAuditLogs(mockAuditLogs);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'tenants':
        return <TenantList tenants={tenants} />;
      case 'configuration':
        return <TenantConfigForm />;
      case 'clients':
        return <ClientManagement />;
      case 'audit':
        return <AuditLogViewer logs={auditLogs} />;
      case 'usage':
        return <UsageAnalytics usage={usageMetrics} />;
      default:
        return <TenantList tenants={tenants} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">OAuth 2.1 MCP Gateway Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Admin User</span>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tenants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('tenants')}
            >
              Tenants
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'configuration'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('configuration')}
            >
              Configuration
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('clients')}
            >
              Clients
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Logs
            </button>
            <button
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'usage'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('usage')}
            >
              Usage & Billing
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="mt-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};