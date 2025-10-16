'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SettingsSection,
  SettingsItem,
  SettingsGroup,
  StatCard,
  DataTable,
  EmptyState,
} from '@/components';
import {
  Code,
  Palette,
  Layout,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Settings,
  Globe,
  Server,
  Key,
  ArrowRight,
  Copy,
  ExternalLink,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Filter,
  Search,
} from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState('buttons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleStates, setToggleStates] = useState({
    notifications: true,
    darkMode: false,
    autopilot: false,
  });

  const badgeVariants = ['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const;
  const badgeSizes = ['sm', 'md', 'lg'] as const;
  const buttonVariants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
  const buttonSizes = ['sm', 'md', 'lg'] as const;

  const sampleTableData = [
    {
      id: 1,
      name: 'Acme Corporation',
      status: 'active',
      requests: 456789,
      errorRate: 0.2,
      lastSeen: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      name: 'Tech Solutions Inc',
      status: 'warning',
      requests: 234567,
      errorRate: 1.8,
      lastSeen: '2024-01-15T09:45:00Z',
    },
    {
      id: 3,
      name: 'Digital Innovations',
      status: 'error',
      requests: 123456,
      errorRate: 3.2,
      lastSeen: '2024-01-15T08:20:00Z',
    },
  ];

  const tableColumns = [
    {
      key: 'name',
      label: 'Organization',
      render: (item: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-wise-green-100 rounded-full flex items-center justify-center">
            <Globe className="w-4 h-4 text-wise-green-primary" />
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <Badge
          variant={
            item.status === 'active' ? 'success' :
            item.status === 'warning' ? 'warning' : 'danger'
          }
          size="sm"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'requests',
      label: 'Requests',
      render: (item: any) => item.requests.toLocaleString(),
    },
    {
      key: 'errorRate',
      label: 'Error Rate',
      render: (item: any) => (
        <span className={`font-medium ${
          item.errorRate < 1 ? 'text-wise-green-primary' :
          item.errorRate < 2 ? 'text-yellow-600' : 'text-red-500'
        }`}>
          {item.errorRate}%
        </span>
      ),
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      render: (item: any) => new Date(item.lastSeen).toLocaleDateString(),
    },
  ];

  const statCards = [
    {
      title: 'Total Requests',
      value: '1.5M',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Activity,
      color: 'green',
    },
    {
      title: 'Success Rate',
      value: '99.8%',
      change: '+0.3%',
      trend: 'up' as const,
      icon: Shield,
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: '12.4K',
      change: '+18.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Avg Response',
      value: '45ms',
      change: '-5.3%',
      trend: 'down' as const,
      icon: Clock,
      color: 'orange',
    },
  ];

  const tabs = [
    { id: 'buttons', label: 'Buttons & Badges', icon: Layout },
    { id: 'cards', label: 'Cards & Settings', icon: Palette },
    { id: 'tables', label: 'Tables & Data', icon: Code },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // In a real app, you'd show a toast notification here
  };

  const getButtonCode = (variant: string, size: string, loading: boolean = false) => {
    return `<Button variant="${variant}" size="${size}" ${loading ? 'loading' : 'icon={<Plus className="w-4 h-4" />'}>
  ${loading ? 'Loading...' : 'Click me'}
</Button>`;
  };

  const getBadgeCode = (variant: string, size: string) => {
    return `<Badge variant="${variant}" size="${size}">
  Label
</Badge>`;
  };

  return (
    <div className="min-h-screen bg-wise-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-wise-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-wise-gray-900">Components Showcase</h1>
              <p className="text-wise-gray-600 mt-2">
                Explore the complete component library for OAuth 2.1 MCP Gateway
              </p>
            </div>
            <Button
              variant="outline"
              icon={showCode ? <EyeOff className="w-4 h-4" /> : <Code className="w-4 h-4" />}
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-wise-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-wise-green-primary text-wise-green-primary'
                      : 'border-transparent text-wise-gray-600 hover:text-wise-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Buttons & Badges Tab */}
        {activeTab === 'buttons' && (
          <div className="space-y-8">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Flexible badge components with multiple variants and sizes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Variants */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      {badgeVariants.map((variant) => (
                        <Badge key={variant} variant={variant}>
                          {variant}
                        </Badge>
                      ))}
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Badge variant="primary">Primary</Badge>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Sizes */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">Sizes</h4>
                    <div className="flex items-center gap-2">
                      {badgeSizes.map((size) => (
                        <Badge key={size} size={size} variant="primary">
                          {size}
                        </Badge>
                      ))}
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Badge size="lg" variant="primary">Large</Badge>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Interactive button components with loading states and icons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Variants */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      {buttonVariants.map((variant) => (
                        <Button key={variant} variant={variant}>
                          {variant}
                        </Button>
                      ))}
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Button variant="primary">{buttonVariants[0]}</Button>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Sizes */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">Sizes</h4>
                    <div className="flex items-center gap-2">
                      {buttonSizes.map((size) => (
                        <Button key={size} size={size} variant="primary">
                          {size}
                        </Button>
                      ))}
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Button size="lg" variant="primary">Large</Button>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">Loading State</h4>
                    <div className="flex items-center gap-2">
                      <Button loading variant="primary">
                        Loading...
                      </Button>
                      <Button loading variant="secondary">
                        Loading...
                      </Button>
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Button loading variant="primary">Loading...</Button>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* With Icons */}
                  <div>
                    <h4 className="text-sm font-medium text-wise-gray-900 mb-3">With Icons</h4>
                    <div className="flex items-center gap-2">
                      <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                        Add New
                      </Button>
                      <Button variant="secondary" icon={<Download className="w-4 h-4" />} iconPosition="right">
                        Download
                      </Button>
                      <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                        Delete
                      </Button>
                    </div>
                    {showCode && (
                      <div className="mt-3 p-3 bg-wise-gray-900 rounded-lg">
                        <pre className="text-sm text-green-400">
                          <code>{`<Button variant="primary" icon={<Plus className="w-4 h-4" />}>
  Add New
</Button>`}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cards & Settings Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Stat Cards</CardTitle>
                <CardDescription>
                  Information cards with statistics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statCards.map((stat, index) => (
                    <StatCard
                      key={index}
                      label={stat.title}
                      value={stat.value}
                      icon={stat.icon}
                      trend={stat.trend === 'up' ? {
                        value: stat.change,
                        isPositive: true,
                      } : {
                        value: stat.change,
                        isPositive: false,
                      }}
                      color={stat.color}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings Components */}
            <Card>
              <CardHeader>
                <CardTitle>Settings Components</CardTitle>
                <CardDescription>
                  Reusable settings sections and items for configuration pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <SettingsSection
                    title="Security Settings"
                    description="Configure security and compliance features"
                    icon={<Shield className="w-5 h-5 text-wise-green-primary" />}
                  >
                    <SettingsGroup>
                      <SettingsItem
                        title="Enable Two-Factor Authentication"
                        description="Add an extra layer of security to your account"
                      >
                        <Button
                          variant="ghost"
                          icon={toggleStates.notifications ? (
                            <CheckCircle className="w-5 h-5 text-wise-green-primary" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                          onClick={() => setToggleStates(prev => ({
                            ...prev,
                            notifications: !prev.notifications
                          }))}
                        >
                          {toggleStates.notifications ? 'Enabled' : 'Disabled'}
                        </Button>
                      </SettingsItem>

                      <SettingsItem
                        title="Login Notifications"
                        description="Get notified when someone logs into your account"
                      >
                        <Button
                          variant="ghost"
                          icon={toggleStates.darkMode ? (
                            <CheckCircle className="w-5 h-5 text-wise-green-primary" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                          onClick={() => setToggleStates(prev => ({
                            ...prev,
                            darkMode: !prev.darkMode
                          }))}
                        >
                          {toggleStates.darkMode ? 'Enabled' : 'Disabled'}
                        </Button>
                      </SettingsItem>
                    </SettingsGroup>
                  </SettingsSection>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tables & Data Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-8">
            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Data Table</CardTitle>
                <CardDescription>
                  Sortable, filterable data table with custom renderers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={sampleTableData}
                  columns={tableColumns}
                  emptyMessage="No organizations found"
                />
              </CardContent>
            </Card>

            {/* Empty State */}
            <Card>
              <CardHeader>
                <CardTitle>Empty State</CardTitle>
                <CardDescription>
                  Consistent empty states for better user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Server}
                  title="No MCP Servers Found"
                  description="Get started by creating your first MCP server configuration."
                  action={
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                      Create Server
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            {/* Modal */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Component</CardTitle>
                <CardDescription>
                  Flexible modal dialog for overlays and confirmations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  Open Modal
                </Button>

                {isModalOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                      <CardHeader>
                        <CardTitle>Confirm Action</CardTitle>
                        <CardDescription>
                          Are you sure you want to proceed with this action?
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-wise-gray-600">
                          This action cannot be undone. Please confirm you understand the consequences.
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                          Confirm
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complex Card Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Complex Layout Example</CardTitle>
                <CardDescription>
                  Advanced card with multiple sections and interactive elements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-wise-gray-900">API Usage</h4>
                      <span className="text-sm text-wise-gray-600">75% used</span>
                    </div>
                    <div className="w-full h-2 bg-wise-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-wise-green-primary rounded-full transition-all duration-300" style={{ width: '75%' }} />
                    </div>
                  </div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-wise-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-wise-green-primary">99.9%</div>
                      <div className="text-xs text-wise-gray-600">Uptime</div>
                    </div>
                    <div className="text-center p-3 bg-wise-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">45ms</div>
                      <div className="text-xs text-wise-gray-600">Latency</div>
                    </div>
                    <div className="text-center p-3 bg-wise-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">1.2K</div>
                      <div className="text-xs text-wise-gray-600">Users</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-wise-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
                        Refresh
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
                        Export
                      </Button>
                    </div>
                    <Button variant="primary" size="sm" icon={<Settings className="w-4 h-4" />}>
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
