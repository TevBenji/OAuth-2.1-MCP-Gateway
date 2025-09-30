/**
 * OAuth 2.1 MCP Gateway Admin UI Components
 * 
 * This module exports all admin dashboard components for the OAuth 2.1 MCP Gateway.
 * These components provide a comprehensive admin interface for tenant management,
 * client configuration, audit logging, and usage analytics.
 */

export { AdminDashboard } from './dashboard';
export { TenantConfigForm } from './tenant-config';
export { TenantList } from './tenant-list';
export { ClientManagement } from './client-management';
export { AuditLogViewer } from './audit-log-viewer';
export { UsageAnalytics } from './usage-analytics';

/**
 * Type definitions for admin UI components
 */
import type { AdminDashboardProps } from './dashboard';
import type { TenantConfigFormProps } from './tenant-config';
import type { TenantListProps } from './tenant-list';
import type { ClientManagementProps } from './client-management';
import type { AuditLogViewerProps } from './audit-log-viewer';
import type { UsageAnalyticsProps } from './usage-analytics';

export type {
  AdminDashboardProps,
  TenantConfigFormProps,
  TenantListProps,
  ClientManagementProps,
  AuditLogViewerProps,
  UsageAnalyticsProps
};