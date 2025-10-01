/**
 * Usage Tracking Service
 *
 * Handles recording and tracking usage metrics for multi-tenant billing
 */
import { UsageRecord, UsageMetrics, UsageAlert, TenantBilling } from '@/types/usage';
import { TenantConfig } from '@/types/tenant';
import { Bindings } from '@/types/bindings';
export declare class UsageTrackingService {
    private db;
    private kv;
    constructor(bindings: Bindings);
    /**
     * Records a usage event for a tenant
     */
    recordUsage(usageRecord: Omit<UsageRecord, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Updates usage metrics in Cloudflare KV for real-time tracking
     */
    private updateKVUsage;
    /**
     * Gets current usage metrics for a tenant in the current period
     */
    getCurrentUsage(tenantId: string): Promise<UsageMetrics | null>;
    /**
     * Gets usage metrics for a tenant in a specific period
     */
    getUsageForPeriod(tenantId: string, period: string): Promise<UsageMetrics | null>;
    /**
     * Gets historical usage data for a tenant within a date range
     */
    getHistoricalUsage(tenantId: string, startDate: Date, endDate: Date): Promise<UsageRecord[]>;
    /**
     * Updates tenant's current usage based on their configuration
     */
    updateTenantUsage(tenantConfig: TenantConfig): Promise<void>;
    /**
     * Gets usage alerts for a tenant
     */
    getUsageAlerts(tenantId: string): Promise<UsageAlert[]>;
    /**
     * Creates a usage alert for a tenant
     */
    createUsageAlert(alert: Omit<UsageAlert, 'id' | 'triggered_at' | 'notification_sent'>): Promise<UsageAlert>;
    /**
     * Resolves a usage alert
     */
    resolveUsageAlert(alertId: string, tenantId: string): Promise<void>;
    /**
     * Gets billing information for a tenant
     */
    getTenantBilling(tenantId: string): Promise<TenantBilling | null>;
    /**
     * Updates billing information for a tenant
     */
    updateTenantBilling(billing: TenantBilling): Promise<void>;
    /**
     * Helper to get current billing period in YYYY-MM format
     */
    private getCurrentPeriod;
}
