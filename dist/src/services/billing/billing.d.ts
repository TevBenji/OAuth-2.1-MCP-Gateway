/**
 * Billing Service
 *
 * Handles billing calculations, tier enforcement, and usage-based billing
 */
import { BillingTierConfig, UsageReport } from '@/types/usage';
import { Bindings } from '@/types/bindings';
export declare class BillingService {
    private usageService;
    private billingTiers;
    private db;
    constructor(bindings: Bindings);
    /**
     * Gets the billing tier configuration for a specific tier
     */
    getTierConfig(tier: string): BillingTierConfig | null;
    /**
     * Gets the billing tier configuration for a specific tenant
     */
    getTierConfigForTenant(tenantId: string): Promise<BillingTierConfig | null>;
    /**
     * Checks if a tenant has exceeded their usage limits
     */
    isUsageWithinLimits(tenantId: string): Promise<{
        withinLimits: boolean;
        exceededLimits?: string[];
    }>;
    /**
     * Enforces usage limits for a tenant
     */
    enforceUsageLimits(tenantId: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Calculates estimated billing cost based on usage
     */
    calculateBillingCost(tenantId: string): Promise<number>;
    /**
     * Generates a usage report for billing
     */
    generateUsageReport(tenantId: string, periodStart: Date, periodEnd: Date): Promise<UsageReport | null>;
    /**
     * Sends usage alerts when limits are接近
     */
    checkAndSendUsageAlerts(): Promise<void>;
    /**
     * Processes billing period end (end of month)
     */
    processBillingPeriodEnd(): Promise<void>;
    /**
     * Processes billing period end for a specific tenant
     */
    private processTenantBillingPeriodEnd;
    /**
     * Check usage thresholds and send alerts if crossed
     */
    checkUsageThresholds(tenantId: string): Promise<void>;
    /**
     * Process all pending usage alerts and send notifications
     */
    processUsageAlerts(): Promise<void>;
}
