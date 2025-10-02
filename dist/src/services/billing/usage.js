/**
 * Usage Tracking Service
 *
 * Handles recording and tracking usage metrics for multi-tenant billing
 */
export class UsageTrackingService {
    db;
    kv;
    constructor(bindings) {
        this.db = bindings.DB;
        this.kv = bindings.USAGE_KV; // Cloudflare KV namespace for usage tracking
    }
    /**
     * Records a usage event for a tenant
     */
    async recordUsage(usageRecord) {
        const id = crypto.randomUUID();
        const timestamp = new Date();
        const record = {
            ...usageRecord,
            id,
            timestamp,
        };
        // Store in database for persistent records
        await this.db
            .prepare(`INSERT INTO usage_records (id, tenant_id, user_id, client_id, resource_id, action, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(id, record.tenant_id, record.user_id || null, record.client_id || null, record.resource_id || null, record.action, record.timestamp.toISOString(), record.metadata ? JSON.stringify(record.metadata) : null)
            .run();
        // Also store in KV for faster aggregation
        const periodKey = `usage:${record.tenant_id}:${this.getCurrentPeriod()}`;
        await this.updateKVUsage(periodKey, record);
    }
    /**
     * Updates usage metrics in Cloudflare KV for real-time tracking
     */
    async updateKVUsage(periodKey, record) {
        // Get current usage from KV
        const currentUsage = (await this.kv.get(periodKey, 'json')) || {
            tenant_id: record.tenant_id,
            period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            mcp_requests: 0,
            token_requests: 0,
            auth_requests: 0,
            peak_concurrent_requests: 0,
            average_response_time_ms: 0,
            data_processed_bytes: 0,
            billable_requests: 0,
            overage_requests: 0,
            estimated_cost: 0,
            currency: 'USD',
        };
        // Update metrics based on the action
        switch (record.action) {
            case 'mcp_request':
                currentUsage.total_requests += 1;
                currentUsage.mcp_requests += 1;
                currentUsage.billable_requests += 1;
                break;
            case 'token_request':
                currentUsage.total_requests += 1;
                currentUsage.token_requests += 1;
                break;
            case 'auth_request':
                currentUsage.total_requests += 1;
                currentUsage.auth_requests += 1;
                break;
            case 'request_success':
                currentUsage.successful_requests += 1;
                break;
            case 'request_failure':
                currentUsage.failed_requests += 1;
                break;
            default:
                currentUsage.total_requests += 1;
                break;
        }
        // Store updated metrics back to KV with TTL (expires at end of month)
        const ttl = Math.floor((currentUsage.period_end.getTime() - Date.now()) / 1000);
        await this.kv.put(periodKey, JSON.stringify(currentUsage), { expirationTtl: ttl });
    }
    /**
     * Gets current usage metrics for a tenant in the current period
     */
    async getCurrentUsage(tenantId) {
        const periodKey = `usage:${tenantId}:${this.getCurrentPeriod()}`;
        return await this.kv.get(periodKey, 'json');
    }
    /**
     * Gets usage metrics for a tenant in a specific period
     */
    async getUsageForPeriod(tenantId, period) {
        const periodKey = `usage:${tenantId}:${period}`;
        return await this.kv.get(periodKey, 'json');
    }
    /**
     * Gets historical usage data for a tenant within a date range
     */
    async getHistoricalUsage(tenantId, startDate, endDate) {
        const result = await this.db
            .prepare(`SELECT * FROM usage_records
       WHERE tenant_id = ? AND timestamp >= ? AND timestamp <= ?
       ORDER BY timestamp DESC`)
            .bind(tenantId, startDate.toISOString(), endDate.toISOString())
            .all();
        return result.results;
    }
    /**
     * Updates tenant's current usage based on their configuration
     */
    async updateTenantUsage(tenantConfig) {
        if (!tenantConfig.tenant_id) {
            throw new Error('Tenant ID is required');
        }
        const currentUsage = await this.getCurrentUsage(tenantConfig.tenant_id);
        if (!currentUsage) {
            return; // No usage recorded yet
        }
        // Update tenant's usage in the database
        await this.db
            .prepare(`UPDATE tenants
       SET current_requests = ?, current_users = ?, current_mcp_servers = ?, current_api_keys = ?
       WHERE id = ?`)
            .bind(currentUsage.total_requests, tenantConfig.max_users, tenantConfig.max_mcp_servers, tenantConfig.max_oauth_clients, tenantConfig.tenant_id)
            .run();
    }
    /**
     * Gets usage alerts for a tenant
     */
    async getUsageAlerts(tenantId) {
        const result = await this.db
            .prepare(`SELECT * FROM usage_alerts
       WHERE tenant_id = ? AND resolved_at IS NULL
       ORDER BY triggered_at DESC`)
            .bind(tenantId)
            .all();
        return result.results;
    }
    /**
     * Creates a usage alert for a tenant
     */
    async createUsageAlert(alert) {
        const id = crypto.randomUUID();
        const triggeredAt = new Date();
        const newAlert = {
            id,
            ...alert,
            triggered_at: triggeredAt,
            notification_sent: false,
        };
        await this.db
            .prepare(`INSERT INTO usage_alerts (id, tenant_id, alert_type, threshold_type, threshold_value,
                                 triggered_at, resolved_at, notification_sent, severity, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(id, newAlert.tenant_id, newAlert.alert_type, newAlert.threshold_type, newAlert.threshold_value, newAlert.triggered_at.toISOString(), newAlert.resolved_at?.toISOString() || null, newAlert.notification_sent, newAlert.severity, newAlert.message)
            .run();
        return newAlert;
    }
    /**
     * Resolves a usage alert
     */
    async resolveUsageAlert(alertId, tenantId) {
        await this.db
            .prepare(`UPDATE usage_alerts
       SET resolved_at = ?
       WHERE id = ? AND tenant_id = ?`)
            .bind(new Date().toISOString(), alertId, tenantId)
            .run();
    }
    /**
     * Gets billing information for a tenant
     */
    async getTenantBilling(tenantId) {
        const result = await this.db
            .prepare(`SELECT * FROM tenant_billing WHERE tenant_id = ?`)
            .bind(tenantId)
            .first();
        if (!result) {
            return null;
        }
        return result;
    }
    /**
     * Updates billing information for a tenant
     */
    async updateTenantBilling(billing) {
        await this.db
            .prepare(`
      INSERT INTO tenant_billing (
        tenant_id, billing_tier, current_period_start, current_period_end,
        subscription_status, last_invoice_date, next_billing_date,
        outstanding_balance, billing_email, auto_renew
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tenant_id) DO UPDATE SET
        billing_tier = excluded.billing_tier,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        subscription_status = excluded.subscription_status,
        last_invoice_date = excluded.last_invoice_date,
        next_billing_date = excluded.next_billing_date,
        outstanding_balance = excluded.outstanding_balance,
        billing_email = excluded.billing_email,
        auto_renew = excluded.auto_renew
    `)
            .bind(billing.tenant_id, billing.billing_tier, billing.current_period_start.toISOString(), billing.current_period_end.toISOString(), billing.subscription_status, billing.last_invoice_date?.toISOString() || null, billing.next_billing_date?.toISOString() || null, billing.outstanding_balance, billing.billing_email, billing.auto_renew)
            .run();
    }
    /**
     * Helper to get current billing period in YYYY-MM format
     */
    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}
