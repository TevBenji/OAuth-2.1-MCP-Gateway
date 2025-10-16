'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { SettingsSection, SettingsItem, SettingsGroup } from '@/components/dashboard/settings/SettingsSection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Shield,
  Key,
  Globe,
  Zap,
  Lock,
  Users,
  Server,
  CheckCircle,
  AlertCircle,
  Settings,
  ToggleLeft,
  ToggleRight,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface GatewaySettings {
  oauthEnabled: boolean;
  pkceRequired: boolean;
  tokenExpiry: number;
  refreshExpiry: number;
  allowedOrigins: string[];
  maxSessions: number;
  auditLogging: boolean;
  riskAssessment: boolean;
  tenantIsolation: boolean;
  resourceIndicators: boolean;
  dynamicRegistration: boolean;
}

export default function GatewaySettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<GatewaySettings>({
    oauthEnabled: true,
    pkceRequired: true,
    tokenExpiry: 3600,
    refreshExpiry: 86400 * 30,
    allowedOrigins: ['http://localhost:3000', 'https://claude.ai', 'https://chatgpt.com'],
    maxSessions: 10,
    auditLogging: true,
    riskAssessment: true,
    tenantIsolation: true,
    resourceIndicators: true,
    dynamicRegistration: true,
  });

  // Mock data - in production, these would come from your backend
  const endpoints = [
    { method: 'GET', path: '/.well-known/oauth-authorization-server', description: 'OAuth 2.1 discovery' },
    { method: 'GET', path: '/authorize', description: 'Authorization endpoint' },
    { method: 'POST', path: '/token', description: 'Token endpoint' },
    { method: 'POST', path: '/register', description: 'Client registration' },
    { method: 'GET', path: '/mcp/:serverId/*', description: 'MCP proxy endpoint' },
  ];

  const recentActivity = [
    { id: 1, action: 'Token issued', time: '2 minutes ago', status: 'success' },
    { id: 2, action: 'Client registered', time: '15 minutes ago', status: 'success' },
    { id: 3, action: 'PKCE validation failed', time: '1 hour ago', status: 'warning' },
    { id: 4, action: 'Rate limit exceeded', time: '3 hours ago', status: 'error' },
  ];

  const handleToggleSetting = (key: keyof GatewaySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Gateway settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-wise-gray-900">Gateway Settings</h1>
          <p className="text-wise-gray-600 mt-1">
            Configure OAuth 2.1 MCP Gateway authentication and security settings
          </p>
        </div>
        <Button
          onClick={handleSaveSettings}
          loading={loading}
          icon={<Save className="w-4 h-4" />}
        >
          Save Settings
        </Button>
      </div>

      {/* OAuth Configuration */}
      <SettingsSection
        title="OAuth Configuration"
        description="Configure OAuth 2.1 authentication settings"
        icon={<Shield className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          <SettingsItem
            title="Enable OAuth"
            description="Enable OAuth 2.1 authentication for MCP requests"
          >
            <button
              onClick={() => handleToggleSetting('oauthEnabled')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.oauthEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Require PKCE"
            description="Enforce PKCE (Proof Key for Code Exchange) for all OAuth flows"
          >
            <button
              onClick={() => handleToggleSetting('pkceRequired')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.pkceRequired ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Access Token Expiry"
            description="Access token lifetime in seconds"
          >
            <select
              value={settings.tokenExpiry}
              onChange={(e) => setSettings(prev => ({ ...prev, tokenExpiry: Number(e.target.value) }))}
              className="input-wise w-32"
            >
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={7200}>2 hours</option>
              <option value={14400}>4 hours</option>
            </select>
          </SettingsItem>

          <SettingsItem
            title="Refresh Token Expiry"
            description="Refresh token lifetime in seconds"
          >
            <select
              value={settings.refreshExpiry}
              onChange={(e) => setSettings(prev => ({ ...prev, refreshExpiry: Number(e.target.value) }))}
              className="input-wise w-32"
            >
              <option value={604800}>7 days</option>
              <option value={2592000}>30 days</option>
              <option value={7776000}>90 days</option>
            </select>
          </SettingsItem>
        </SettingsGroup>
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection
        title="Security Settings"
        description="Configure security and compliance features"
        icon={<Lock className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          <SettingsItem
            title="Tenant Isolation"
            description="Enable multi-tenant tenant isolation"
          >
            <button
              onClick={() => handleToggleSetting('tenantIsolation')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.tenantIsolation ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Audit Logging"
            description="Enable comprehensive audit logging for compliance"
          >
            <button
              onClick={() => handleToggleSetting('auditLogging')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.auditLogging ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Risk Assessment"
            description="Enable risk-based authentication scoring"
          >
            <button
              onClick={() => handleToggleSetting('riskAssessment')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.riskAssessment ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Max Concurrent Sessions"
            description="Maximum allowed sessions per user"
          >
            <input
              type="number"
              value={settings.maxSessions}
              onChange={(e) => setSettings(prev => ({ ...prev, maxSessions: Number(e.target.value) }))}
              className="input-wise w-24"
              min="1"
              max="100"
            />
          </SettingsItem>
        </SettingsGroup>
      </SettingsSection>

      {/* Advanced Features */}
      <SettingsSection
        title="Advanced Features"
        description="Configure advanced OAuth 2.1 and MCP features"
        icon={<Settings className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          <SettingsItem
            title="Resource Indicators"
            description="Enable RFC 8707 Resource Indicators for audience-specific tokens"
          >
            <button
              onClick={() => handleToggleSetting('resourceIndicators')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.resourceIndicators ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>

          <SettingsItem
            title="Dynamic Client Registration"
            description="Enable RFC 7591 Dynamic Client Registration"
          >
            <button
              onClick={() => handleToggleSetting('dynamicRegistration')}
              className="text-wise-green-primary hover:text-wise-green-600"
            >
              {settings.dynamicRegistration ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </SettingsItem>
        </SettingsGroup>
      </SettingsSection>

      {/* API Endpoints */}
      <SettingsSection
        title="API Endpoints"
        description="OAuth 2.1 and MCP gateway endpoints"
        icon={<Server className="w-5 h-5 text-wise-green-primary" />}
      >
        <div className="space-y-3">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between py-3 px-4 bg-wise-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" size="sm">
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono text-wise-gray-800">{endpoint.path}</code>
                <span className="text-sm text-wise-gray-600">{endpoint.description}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(endpoint.path)}
                  className="p-1 hover:bg-wise-gray-200 rounded"
                >
                  <Copy className="w-4 h-4 text-wise-gray-600" />
                </button>
                <a
                  href={`/docs${endpoint.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-wise-gray-200 rounded"
                >
                  <ExternalLink className="w-4 h-4 text-wise-gray-600" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Recent Activity */}
      <SettingsSection
        title="Recent Activity"
        description="Recent gateway authentication events"
        icon={<RefreshCw className="w-5 h-5 text-wise-green-primary" />}
      >
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-wise-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                {activity.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-wise-green-primary" />
                )}
                {activity.status === 'warning' && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                {activity.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-wise-gray-900">{activity.action}</span>
              </div>
              <span className="text-sm text-wise-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Gateway Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-wise-green-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-wise-green-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Gateway Status</CardTitle>
              <p className="text-wise-gray-600 mt-1">Current gateway operational status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Healthy
              </Badge>
              <p className="text-sm text-wise-gray-600">All systems operational</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-wise-gray-900">99.99%</p>
              <p className="text-sm text-wise-gray-600">Uptime (30 days)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-wise-gray-900">&lt;50ms</p>
              <p className="text-sm text-wise-gray-600">Average latency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
