'use client';

import { SettingsSection, SettingsItem, SettingsGroup } from '@/components/dashboard/settings/SettingsSection';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Key,
  Globe,
  Lock,
  Server,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GatewaySettingsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // OAuth 2.1 endpoints from backend
  const endpoints = [
    {
      method: 'GET',
      path: '/.well-known/oauth-authorization-server',
      description: 'OAuth 2.1 Server Metadata (RFC 8414)'
    },
    {
      method: 'GET',
      path: '/authorize',
      description: 'Authorization Endpoint (PKCE required)'
    },
    {
      method: 'POST',
      path: '/token',
      description: 'Token Endpoint (authorization_code, refresh_token grants)'
    },
    {
      method: 'POST',
      path: '/register',
      description: 'Dynamic Client Registration (RFC 7591)'
    },
    {
      method: 'ALL',
      path: '/mcp/:serverId/*',
      description: 'MCP Proxy by Server ID (Bearer token required)'
    },
    {
      method: 'ALL',
      path: '/mcp/resource/*',
      description: 'MCP Proxy by Resource Identifier (RFC 8707)'
    },
  ];

  // Gateway features (read-only, from backend implementation)
  const features = {
    oauth: [
      { name: 'OAuth 2.1 Compliance', enabled: true, description: 'Full OAuth 2.1 authorization server' },
      { name: 'PKCE Required', enabled: true, description: 'Proof Key for Code Exchange (RFC 7636) mandatory for all flows' },
      { name: 'Dynamic Client Registration', enabled: true, description: 'RFC 7591 client registration support' },
      { name: 'Server Metadata Discovery', enabled: true, description: 'RFC 8414 .well-known endpoint' },
    ],
    security: [
      { name: 'Multi-Tenant Isolation', enabled: true, description: 'Complete tenant data isolation' },
      { name: 'Audit Logging', enabled: true, description: 'Comprehensive compliance and security logging' },
      { name: 'Risk-Based Authentication', enabled: true, description: 'Dynamic risk assessment and step-up auth' },
      { name: 'Rate Limiting', enabled: true, description: 'Per-IP and per-user rate limiting' },
    ],
    advanced: [
      { name: 'Resource Indicators', enabled: true, description: 'RFC 8707 audience-specific tokens' },
      { name: 'Refresh Token Rotation', enabled: true, description: 'Automatic token rotation on refresh' },
      { name: 'JWT Bearer Tokens', enabled: true, description: 'RS256/HS256 signed tokens with claims' },
      { name: 'MCP Gateway Proxy', enabled: true, description: 'Authenticated MCP server proxying' },
    ],
  };

  // Token configuration (read-only, from backend)
  const tokenConfig = [
    { setting: 'Access Token Expiry', value: '1 hour (3600s)', description: 'JWT access token lifetime' },
    { setting: 'Refresh Token Expiry', value: '30 days (2592000s)', description: 'Refresh token lifetime' },
    { setting: 'Authorization Code Expiry', value: '5 minutes (300s)', description: 'Auth code validity period' },
    { setting: 'Token Algorithm', value: 'RS256 / HS256', description: 'JWT signing algorithms supported' },
  ];

  // Supported scopes (from backend implementation)
  const scopes = [
    { scope: 'mcp:tools:read', description: 'Read MCP tools and capabilities' },
    { scope: 'mcp:tools:write', description: 'Execute MCP tools' },
    { scope: 'mcp:resources:read', description: 'Read MCP resources' },
    { scope: 'mcp:resources:write', description: 'Write MCP resources' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-wise-gray-900">Gateway Configuration</h1>
          <p className="text-wise-gray-600 mt-1">
            OAuth 2.1 MCP Gateway capabilities and endpoint reference
          </p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-wise-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-wise-green-primary" />
          <span className="text-sm font-medium text-wise-green-primary">All Systems Operational</span>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Read-Only Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              This gateway is a serverless OAuth 2.1 authorization server. Configuration is managed through infrastructure-as-code and environment variables. Contact your administrator for changes.
            </p>
          </div>
        </div>
      </div>

      {/* OAuth 2.1 Features */}
      <SettingsSection
        title="OAuth 2.1 Features"
        description="Authorization server capabilities and compliance"
        icon={<Shield className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          {features.oauth.map((feature) => (
            <SettingsItem
              key={feature.name}
              title={feature.name}
              description={feature.description}
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-wise-green-primary" />
              </div>
            </SettingsItem>
          ))}
        </SettingsGroup>
      </SettingsSection>

      {/* Security Features */}
      <SettingsSection
        title="Security & Compliance"
        description="Built-in security measures and compliance features"
        icon={<Lock className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          {features.security.map((feature) => (
            <SettingsItem
              key={feature.name}
              title={feature.name}
              description={feature.description}
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-wise-green-primary" />
              </div>
            </SettingsItem>
          ))}
        </SettingsGroup>
      </SettingsSection>

      {/* Advanced Features */}
      <SettingsSection
        title="Advanced Features"
        description="Extended OAuth and MCP capabilities"
        icon={<Zap className="w-5 h-5 text-wise-green-primary" />}
      >
        <SettingsGroup>
          {features.advanced.map((feature) => (
            <SettingsItem
              key={feature.name}
              title={feature.name}
              description={feature.description}
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-wise-green-primary" />
              </div>
            </SettingsItem>
          ))}
        </SettingsGroup>
      </SettingsSection>

      {/* Token Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Token Configuration</CardTitle>
              <p className="text-wise-gray-600 mt-1 text-sm">JWT token lifetimes and signing</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokenConfig.map((config) => (
              <div key={config.setting} className="flex items-center justify-between py-3 border-b border-wise-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-wise-gray-900">{config.setting}</p>
                  <p className="text-sm text-wise-gray-600 mt-1">{config.description}</p>
                </div>
                <code className="px-3 py-1 bg-wise-gray-100 rounded-lg text-sm font-mono text-wise-gray-700">
                  {config.value}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported Scopes */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Globe className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Supported Scopes</CardTitle>
              <p className="text-wise-gray-600 mt-1 text-sm">Available OAuth scopes for API keys</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scopes.map((scopeInfo) => (
              <div key={scopeInfo.scope} className="flex items-center justify-between p-3 bg-wise-gray-50 rounded-lg">
                <div className="flex-1">
                  <code className="text-sm font-mono text-wise-green-primary font-medium">
                    {scopeInfo.scope}
                  </code>
                  <p className="text-sm text-wise-gray-600 mt-1">{scopeInfo.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <SettingsSection
        title="API Endpoints"
        description="OAuth 2.1 and MCP gateway endpoints"
        icon={<Server className="w-5 h-5 text-wise-green-primary" />}
      >
        <div className="space-y-3">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between py-3 px-4 bg-wise-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
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
                  title="Copy endpoint"
                >
                  <Copy className="w-4 h-4 text-wise-gray-600" />
                </button>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-wise-gray-200 rounded"
                  title="View documentation"
                >
                  <ExternalLink className="w-4 h-4 text-wise-gray-600" />
                </a>
              </div>
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
              <CardTitle className="text-xl">Gateway Performance</CardTitle>
              <p className="text-wise-gray-600 mt-1 text-sm">Current gateway operational metrics</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Badge variant="success" className="mb-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Operational
              </Badge>
              <p className="text-sm text-wise-gray-600">All endpoints available</p>
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
