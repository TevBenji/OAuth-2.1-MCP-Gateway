/**
 * Billing Service
 *
 * Handles billing calculations, tier enforcement, and usage-based billing
 */
import { UsageTrackingService } from './usage';
import { NotificationService } from './notifications';
export class BillingService {
    usageService;
    billingTiers;
    db;
    constructor(bindings) {
        this.usageService = new UsageTrackingService(bindings);
        this.db = bindings.DB;
        this.billingTiers = {
            free: {
                tier: 'free',
                name: 'Free Tier',
                monthly_fee: 0, // in cents
                currency: 'USD',
                limits: {
                    requests_per_month: 10000,
                    storage_gb: 1,
                    users: 5,
                    mcp_servers: 3,
                    api_keys: 5,
                    custom_domains: 0,
                    sso: false,
                    dedicated_support: false,
                    audit_retention_days: 30
                },
                overage_costs: {
                    request: 0, // Free tier doesn't allow overages
                    gb_storage: 0,
                    user: 0
                }
            },
            pro: {
                tier: 'pro',
                name: 'Pro Plan',
                monthly_fee: 29900, // $299 in cents
                currency: 'USD',
                limits: {
                    requests_per_month: 100000,
                    storage_gb: 10,
                    users: 25,
                    mcp_servers: 10,
                    api_keys: 20,
                    custom_domains: 1,
                    sso: true,
                    dedicated_support: false,
                    audit_retention_days: 90
                },
                overage_costs: {
                    request: 100, // $1 per 1000 requests over limit (in cents)
                    gb_storage: 1000, // $10 per GB over limit (in cents)
                    user: 500 // $5 per user over limit (in cents)
                }
            },
            business: {
                tier: 'business',
                name: 'Business Plan',
                monthly_fee: 99900, // $999 in cents
                currency: 'USD',
                limits: {
                    requests_per_month: 1000000,
                    storage_gb: 50,
                    users: 100,
                    mcp_servers: 50,
                    api_keys: 50,
                    custom_domains: 3,
                    sso: true,
                    dedicated_support: true,
                    audit_retention_days: 365
                },
                overage_costs: {
                    request: 50, // $0.50 per 1000 requests over limit (in cents)
                    gb_storage: 500, // $5 per GB over limit (in cents)
                    user: 250 // $2.50 per user over limit (in cents)
                }
            },
            enterprise: {
                tier: 'enterprise',
                name: 'Enterprise Plan',
                monthly_fee: 299900, // $2,999 in cents
                currency: 'USD',
                limits: {
                    requests_per_month: 10000000,
                    storage_gb: 500,
                    users: 1000,
                    mcp_servers: 200,
                    api_keys: 100,
                    custom_domains: 10,
                    sso: true,
                    dedicated_support: true,
                    audit_retention_days: 2555 // 7 years
                },
                overage_costs: {
                    request: 25, // $0.25 per 1000 requests over limit (in cents)
                    gb_storage: 250, // $2.50 per GB over limit (in cents)
                    user: 100 // $1 per user over limit (in cents)
                }
            }
        };
    }
    /**
     * Gets the billing tier configuration for a specific tier
     */
    getTierConfig(tier) {
        return this.billingTiers[tier] || null;
    }
    /**
     * Gets the billing tier configuration for a specific tenant
     */
    async getTierConfigForTenant(tenantId) {
        const billing = await this.usageService.getTenantBilling(tenantId);
        if (!billing) {
            // Default to free tier if no billing info
            return this.billingTiers['free'] || null;
        }
        return this.billingTiers[billing.billing_tier] || null;
    }
    /**
     * Checks if a tenant has exceeded their usage limits
     */
    async isUsageWithinLimits(tenantId) {
        const billing = await this.usageService.getTenantBilling(tenantId);
        if (!billing) {
            // If no billing info, assume free tier limits
            return {
                withinLimits: false,
                exceededLimits: ['no_billing_info']
            };
        }
        const currentUsage = await this.usageService.getCurrentUsage(tenantId);
        if (!currentUsage) {
            return { withinLimits: true }; // No usage yet
        }
        const tierConfig = this.billingTiers[billing.billing_tier];
        if (!tierConfig) {
            return { withinLimits: false, exceededLimits: ['invalid_tier'] };
        }
        const exceededLimits = [];
        // Check request limits
        if (currentUsage.total_requests > tierConfig.limits.requests_per_month) {
            exceededLimits.push('requests_per_month');
        }
        // We'll fetch additional tenant data to check other limits
        try {
            const tenantResult = await this.db.prepare(`SELECT max_users, max_mcp_servers, max_oauth_clients 
         FROM tenants 
         WHERE tenant_id = ?`)
                .bind(tenantId)
                .first();
            if (tenantResult) {
                const tenantData = tenantResult;
                if (tenantData.max_users > tierConfig.limits.users) {
                    exceededLimits.push('users');
                }
                if (tenantData.max_mcp_servers > tierConfig.limits.mcp_servers) {
                    exceededLimits.push('mcp_servers');
                }
                if (tenantData.max_oauth_clients > tierConfig.limits.api_keys) {
                    exceededLimits.push('api_keys');
                }
            }
        }
        catch (error) {
            console.error('Error checking tenant limits:', error);
        }
        return {
            withinLimits: exceededLimits.length === 0,
            exceededLimits
        };
    }
    /**
     * Enforces usage limits for a tenant
     */
    async enforceUsageLimits(tenantId) {
        const limitsCheck = await this.isUsageWithinLimits(tenantId);
        if (!limitsCheck.withinLimits) {
            // Check if this is the free tier with no overages allowed
            const billing = await this.usageService.getTenantBilling(tenantId);
            if (billing && billing.billing_tier === 'free') {
                return {
                    allowed: false,
                    reason: `Usage limit exceeded for ${limitsCheck.exceededLimits?.join(', ')}`
                };
            }
            // For paid tiers, we may allow some overages but trigger alerts
            if (limitsCheck.exceededLimits?.includes('requests_per_month')) {
                const alert = await this.usageService.createUsageAlert({
                    tenant_id: tenantId,
                    alert_type: 'usage_threshold',
                    threshold_type: 'absolute',
                    threshold_value: this.billingTiers[billing?.billing_tier || 'free'].limits.requests_per_month,
                    severity: 'high',
                    message: `Tenant ${tenantId} has exceeded their monthly request limit`
                });
            }
        }
        return { allowed: limitsCheck.withinLimits };
    }
    /**
     * Calculates estimated billing cost based on usage
     */
    async calculateBillingCost(tenantId) {
        const billing = await this.usageService.getTenantBilling(tenantId);
        if (!billing) {
            return 0;
        }
        const currentUsage = await this.usageService.getCurrentUsage(tenantId);
        if (!currentUsage) {
            return this.billingTiers[billing.billing_tier]?.monthly_fee || 0;
        }
        const tierConfig = this.billingTiers[billing.billing_tier];
        if (!tierConfig) {
            return 0;
        }
        // Base monthly fee
        let totalCost = tierConfig.monthly_fee;
        // Calculate overage costs
        if (currentUsage.billable_requests > tierConfig.limits.requests_per_month) {
            const overageRequests = currentUsage.billable_requests - tierConfig.limits.requests_per_month;
            const thousandRequestBatches = Math.ceil(overageRequests / 1000);
            totalCost += thousandRequestBatches * tierConfig.overage_costs.request;
        }
        // TODO: Add calculations for storage, users, etc. when we have that data
        return totalCost;
    }
    /**
     * Generates a usage report for billing
     */
    async generateUsageReport(tenantId, periodStart, periodEnd) {
        const billing = await this.usageService.getTenantBilling(tenantId);
        if (!billing) {
            return null;
        }
        // Get usage metrics for the period
        const currentUsage = await this.usageService.getCurrentUsage(tenantId);
        if (!currentUsage) {
            return null;
        }
        // Get usage alerts for the period
        const alerts = await this.usageService.getUsageAlerts(tenantId);
        // Calculate costs
        const baseTierCost = this.billingTiers[billing.billing_tier]?.monthly_fee || 0;
        let overageCost = 0;
        if (currentUsage.billable_requests > this.billingTiers[billing.billing_tier]?.limits.requests_per_month) {
            const tierConfig = this.billingTiers[billing.billing_tier];
            const overageRequests = currentUsage.billable_requests - tierConfig.limits.requests_per_month;
            const thousandRequestBatches = Math.ceil(overageRequests / 1000);
            overageCost = thousandRequestBatches * tierConfig.overage_costs.request;
        }
        const totalCost = baseTierCost + overageCost;
        // Build cost breakdown
        const costBreakdown = {
            base_tier_cost: baseTierCost,
            overage_cost: overageCost,
            total_cost: totalCost,
            currency: this.billingTiers[billing.billing_tier]?.currency || 'USD',
            details: [
                {
                    category: 'Base Plan',
                    count: 1,
                    unit_cost: baseTierCost,
                    total_cost: baseTierCost
                }
            ]
        };
        if (overageCost > 0) {
            costBreakdown.details.push({
                category: 'Usage Overage',
                count: currentUsage.billable_requests - this.billingTiers[billing.billing_tier]?.limits.requests_per_month,
                unit_cost: this.billingTiers[billing.billing_tier]?.overage_costs.request || 0,
                total_cost: overageCost
            });
        }
        const report = {
            tenant_id: tenantId,
            report_period_start: periodStart,
            report_period_end: periodEnd,
            generated_at: new Date(),
            metrics: currentUsage,
            alerts,
            cost_breakdown: costBreakdown
        };
        return report;
    }
    /**
     * Sends usage alerts when limits are接近
     */
    async checkAndSendUsageAlerts() {
        // Get all tenants and their billing info
        const result = await this.db.prepare(`SELECT tenant_id, billing_tier FROM tenant_billing`).all();
        for (const row of result.results) {
            const tenantId = row.tenant_id;
            const billingTier = row.billing_tier;
            const currentUsage = await this.usageService.getCurrentUsage(tenantId);
            if (!currentUsage)
                continue;
            const tierConfig = this.billingTiers[billingTier];
            if (!tierConfig)
                continue;
            // Check if usage is at 80% or more of the limit for requests
            const usagePercentage = (currentUsage.billable_requests / tierConfig.limits.requests_per_month) * 100;
            if (usagePercentage >= 80) {
                await this.usageService.createUsageAlert({
                    tenant_id: tenantId,
                    alert_type: 'usage_threshold',
                    threshold_type: 'percentage',
                    threshold_value: 80,
                    severity: usagePercentage >= 90 ? 'critical' : 'high',
                    message: `Tenant ${tenantId} has used ${Math.round(usagePercentage)}% of their monthly request allocation`
                });
            }
        }
    }
    /**
     * Processes billing period end (end of month)
     */
    async processBillingPeriodEnd() {
        // Get all tenants with active subscriptions
        const result = await this.db.prepare(`SELECT tenant_id, billing_tier, current_period_end FROM tenant_billing
       WHERE subscription_status = 'active'`).all();
        for (const row of result.results) {
            const tenantId = row.tenant_id;
            const currentPeriodEnd = new Date(row.current_period_end);
            // Only process if the period ended today
            const today = new Date();
            if (currentPeriodEnd.getDate() === today.getDate() &&
                currentPeriodEnd.getMonth() === today.getMonth() &&
                currentPeriodEnd.getFullYear() === today.getFullYear()) {
                await this.processTenantBillingPeriodEnd(tenantId);
            }
        }
    }
    /**
     * Processes billing period end for a specific tenant
     */
    async processTenantBillingPeriodEnd(tenantId) {
        // Calculate costs for the ended period
        const cost = await this.calculateBillingCost(tenantId);
        // Generate usage report for the period
        const currentUsage = await this.usageService.getCurrentUsage(tenantId);
        if (currentUsage) {
            const report = await this.generateUsageReport(tenantId, currentUsage.period_start, currentUsage.period_end);
            // Save report to the database
            if (report) {
                await this.db.prepare(`INSERT INTO usage_reports 
           (tenant_id, period_start, period_end, generated_at, report_data)
           VALUES (?, ?, ?, ?, ?)`)
                    .bind(tenantId, report.report_period_start.toISOString(), report.report_period_end.toISOString(), report.generated_at.toISOString(), JSON.stringify(report))
                    .run();
            }
        }
        // Update billing record for next period
        const nextPeriodStart = new Date();
        nextPeriodStart.setDate(1); // First day of next month
        nextPeriodStart.setMonth(nextPeriodStart.getMonth() + 1);
        const nextPeriodEnd = new Date(nextPeriodStart.getFullYear(), nextPeriodStart.getMonth() + 1, 0);
        // Reset usage counter for next period
        await this.db.prepare(`UPDATE tenant_billing 
       SET current_period_start = ?, current_period_end = ?, last_invoice_date = ?
       WHERE tenant_id = ?`)
            .bind(nextPeriodStart.toISOString(), nextPeriodEnd.toISOString(), new Date().toISOString(), tenantId)
            .run();
        // Clear usage metrics for next period
        const periodKey = `usage:${tenantId}:${nextPeriodStart.getFullYear()}-${String(nextPeriodStart.getMonth() + 1).padStart(2, '0')}`;
        await this.usageService['kv'].delete(periodKey);
    }
    /**
     * Check usage thresholds and send alerts if crossed
     */
    async checkUsageThresholds(tenantId) {
        const billing = await this.usageService.getTenantBilling(tenantId);
        if (!billing) {
            return; // No billing info for tenant
        }
        const currentUsage = await this.usageService.getCurrentUsage(tenantId);
        if (!currentUsage) {
            return; // No usage data for tenant
        }
        const tierConfig = this.billingTiers[billing.billing_tier];
        if (!tierConfig) {
            return; // Invalid tier
        }
        // Check request usage percentage
        const requestUsagePercent = (currentUsage.billable_requests / tierConfig.limits.requests_per_month) * 100;
        // Send alerts at different thresholds
        if (requestUsagePercent >= 90) {
            await this.usageService.createUsageAlert({
                tenant_id: tenantId,
                alert_type: 'usage_threshold',
                threshold_type: 'percentage',
                threshold_value: 90,
                severity: 'critical',
                message: `Critical: Tenant ${tenantId} has reached ${Math.round(requestUsagePercent)}% of monthly request allocation`
            });
        }
        else if (requestUsagePercent >= 80) {
            await this.usageService.createUsageAlert({
                tenant_id: tenantId,
                alert_type: 'usage_threshold',
                threshold_type: 'percentage',
                threshold_value: 80,
                severity: 'high',
                message: `Warning: Tenant ${tenantId} has reached ${Math.round(requestUsagePercent)}% of monthly request allocation`
            });
        }
        else if (requestUsagePercent >= 70) {
            await this.usageService.createUsageAlert({
                tenant_id: tenantId,
                alert_type: 'usage_threshold',
                threshold_type: 'percentage',
                threshold_value: 70,
                severity: 'medium',
                message: `Notice: Tenant ${tenantId} has reached ${Math.round(requestUsagePercent)}% of monthly request allocation`
            });
        }
    }
    /**
     * Process all pending usage alerts and send notifications
     */
    async processUsageAlerts() {
        const notificationService = new NotificationService({}); // This would need actual bindings
        // In a real implementation, this would process all pending alerts
        // and send notifications through the notification service
        // For now, log that we're processing alerts
        console.log('Processing usage alerts...');
    }
}
