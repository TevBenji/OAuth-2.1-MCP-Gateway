/**
 * Unit tests for Billing Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '@/services/billing/billing';
// Mock D1Database
const mockD1Prepare = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn().mockResolvedValue(null),
};
const mockD1Database = {
    prepare: vi.fn().mockReturnValue(mockD1Prepare),
};
// Mock KVNamespace
const mockKVNamespace = {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
};
const mockBindings = {
    DB: mockD1Database,
    USAGE_KV: mockKVNamespace,
    JWT_ISSUER: 'test-issuer',
    PKCE_REQUIRED: 'true',
    CORS_ORIGINS: 'http://localhost:3000',
};
// Mock UsageTrackingService
const mockUsageService = {
    getTenantBilling: vi.fn(),
    getCurrentUsage: vi.fn(),
    getUsageForPeriod: vi.fn(),
    getHistoricalUsage: vi.fn(),
    getUsageAlerts: vi.fn(),
    createUsageAlert: vi.fn(),
    updateTenantUsage: vi.fn(),
    updateTenantBilling: vi.fn(),
};
vi.mock('@/services/billing/usage', () => ({
    UsageTrackingService: vi.fn(() => mockUsageService),
}));
describe('BillingService', () => {
    let billingService;
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        // Create new instance to reset internal state
        billingService = new BillingService(mockBindings);
        // Re-mock the usage service
        mockUsageService.getTenantBilling.mockClear();
        mockUsageService.getCurrentUsage.mockClear();
    });
    describe('getTierConfig', () => {
        it('should return the correct configuration for a valid tier', () => {
            const freeTierConfig = billingService.getTierConfig('free');
            expect(freeTierConfig).toBeDefined();
            expect(freeTierConfig?.tier).toBe('free');
            expect(freeTierConfig?.monthly_fee).toBe(0);
            expect(freeTierConfig?.limits.requests_per_month).toBe(10000);
        });
        it('should return null for an invalid tier', () => {
            const invalidTierConfig = billingService.getTierConfig('invalid-tier');
            expect(invalidTierConfig).toBeNull();
        });
    });
    describe('isUsageWithinLimits', () => {
        it('should return false if no billing info exists', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce(null);
            const result = await billingService.isUsageWithinLimits('test-tenant-id');
            expect(result.withinLimits).toBe(false);
            expect(result.exceededLimits).toContain('no_billing_info');
        });
        it('should return true if no usage data exists', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro',
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce(null);
            const result = await billingService.isUsageWithinLimits('test-tenant-id');
            expect(result.withinLimits).toBe(true);
        });
        it('should return false if usage exceeds limits', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'free', // Free tier has 10,000 request limit
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 15000, // Exceeds free tier limit
                successful_requests: 14500,
                failed_requests: 500,
                mcp_requests: 10000,
                token_requests: 3000,
                auth_requests: 2000,
                peak_concurrent_requests: 100,
                average_response_time_ms: 250,
                data_processed_bytes: 1024000,
                billable_requests: 15000,
                overage_requests: 5000,
                estimated_cost: 0,
                currency: 'USD'
            });
            const result = await billingService.isUsageWithinLimits('test-tenant-id');
            expect(result.withinLimits).toBe(false);
            expect(result.exceededLimits).toContain('requests_per_month');
        });
        it('should return true if usage is within limits', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro', // Pro tier has 100,000 request limit
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 50000, // Within pro tier limit
                successful_requests: 49500,
                failed_requests: 500,
                mcp_requests: 40000,
                token_requests: 5000,
                auth_requests: 5000,
                peak_concurrent_requests: 50,
                average_response_time_ms: 200,
                data_processed_bytes: 512000,
                billable_requests: 50000,
                overage_requests: 0,
                estimated_cost: 0,
                currency: 'USD'
            });
            const result = await billingService.isUsageWithinLimits('test-tenant-id');
            expect(result.withinLimits).toBe(true);
            expect(result.exceededLimits).toEqual([]);
        });
    });
    describe('enforceUsageLimits', () => {
        it('should return allowed: false for free tier that exceeds limits', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'free',
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 15000, // Exceeds free tier limit
                successful_requests: 14500,
                failed_requests: 500,
                mcp_requests: 10000,
                token_requests: 3000,
                auth_requests: 2000,
                peak_concurrent_requests: 100,
                average_response_time_ms: 250,
                data_processed_bytes: 1024000,
                billable_requests: 15000,
                overage_requests: 5000,
                estimated_cost: 0,
                currency: 'USD'
            });
            const result = await billingService.enforceUsageLimits('test-tenant-id');
            expect(result.allowed).toBe(false);
        });
        it('should return allowed: true for paid tier within limits', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro',
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 50000, // Within pro tier limit
                successful_requests: 49500,
                failed_requests: 500,
                mcp_requests: 40000,
                token_requests: 5000,
                auth_requests: 5000,
                peak_concurrent_requests: 50,
                average_response_time_ms: 200,
                data_processed_bytes: 512000,
                billable_requests: 50000,
                overage_requests: 0,
                estimated_cost: 0,
                currency: 'USD'
            });
            const result = await billingService.enforceUsageLimits('test-tenant-id');
            expect(result.allowed).toBe(true);
        });
    });
    describe('calculateBillingCost', () => {
        it('should calculate cost with overages for requests', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro', // Pro tier: 100,000 requests included, then $1 per 1000 requests overage
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 150000, // 50,000 over the 100,000 limit
                successful_requests: 149500,
                failed_requests: 500,
                mcp_requests: 120000,
                token_requests: 20000,
                auth_requests: 10000,
                peak_concurrent_requests: 150,
                average_response_time_ms: 300,
                data_processed_bytes: 1536000,
                billable_requests: 150000,
                overage_requests: 50000,
                estimated_cost: 0,
                currency: 'USD'
            });
            const cost = await billingService.calculateBillingCost('test-tenant-id');
            // Pro tier base cost: $299 (29,900 cents)
            // Overage: 50,000 requests over = 50 batches of 1000 = 50 * $1 = $50 (5,000 cents)
            // Total: $349 (34,900 cents)
            expect(cost).toBe(34900); // 34900 cents = $349
        });
        it('should calculate base cost only when within limits', async () => {
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro',
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 50000, // Within pro tier limit
                successful_requests: 49500,
                failed_requests: 500,
                mcp_requests: 40000,
                token_requests: 5000,
                auth_requests: 5000,
                peak_concurrent_requests: 50,
                average_response_time_ms: 200,
                data_processed_bytes: 512000,
                billable_requests: 50000,
                overage_requests: 0,
                estimated_cost: 0,
                currency: 'USD'
            });
            const cost = await billingService.calculateBillingCost('test-tenant-id');
            // Pro tier base cost: $299 (29,900 cents), no overages
            expect(cost).toBe(29900); // 29900 cents = $299
        });
    });
    describe('generateUsageReport', () => {
        it('should generate a detailed usage report', async () => {
            const periodStart = new Date('2023-01-01');
            const periodEnd = new Date('2023-01-31');
            mockUsageService.getTenantBilling.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                billing_tier: 'pro',
                current_period_start: new Date(),
                current_period_end: new Date(),
                subscription_status: 'active',
                last_invoice_date: null,
                next_billing_date: null,
                outstanding_balance: 0,
                billing_email: 'test@example.com',
                auto_renew: true
            });
            mockUsageService.getCurrentUsage.mockResolvedValueOnce({
                tenant_id: 'test-tenant-id',
                period_start: new Date(),
                period_end: new Date(),
                total_requests: 50000,
                successful_requests: 49500,
                failed_requests: 500,
                mcp_requests: 40000,
                token_requests: 5000,
                auth_requests: 5000,
                peak_concurrent_requests: 50,
                average_response_time_ms: 200,
                data_processed_bytes: 512000,
                billable_requests: 50000,
                overage_requests: 0,
                estimated_cost: 0,
                currency: 'USD'
            });
            mockUsageService.getUsageAlerts.mockResolvedValueOnce([]);
            const report = await billingService.generateUsageReport('test-tenant-id', periodStart, periodEnd);
            expect(report).toBeDefined();
            expect(report?.tenant_id).toBe('test-tenant-id');
            expect(report?.report_period_start).toEqual(periodStart);
            expect(report?.report_period_end).toEqual(periodEnd);
            expect(report?.metrics).toBeDefined();
            expect(report?.cost_breakdown).toBeDefined();
        });
    });
});
