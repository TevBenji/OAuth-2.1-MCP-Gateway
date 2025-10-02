/**
 * Billing Feature Enforcement Middleware
 *
 * Middleware to enforce feature availability based on billing tier
 */
import { BillingService } from '@/services/billing/billing';
import { TenantNotFoundError } from '@/types/tenant';
export async function featureEnforcementMiddleware(c, next) {
    const tenantId = c.req.header('X-Tenant-ID') ||
        c.get('tenantId') ||
        'default';
    try {
        const billingService = new BillingService(c.env);
        const tierConfig = await billingService.getTierConfigForTenant(tenantId);
        if (!tierConfig) {
            return c.json({
                error: 'access_denied',
                message: 'Unable to determine tenant billing tier'
            }, 403);
        }
        // Check if the request is for a feature that requires a certain tier
        const path = c.req.path;
        // Features that require specific tiers
        if (path.includes('/sso') && !tierConfig.limits.sso) {
            return c.json({
                error: 'feature_not_available',
                message: 'Single Sign-On (SSO) is not available in your billing tier'
            }, 403);
        }
        if (path.includes('/custom-domain') && tierConfig.limits.custom_domains <= 0) {
            return c.json({
                error: 'feature_not_available',
                message: 'Custom domains are not available in your billing tier'
            }, 403);
        }
        if (path.includes('/dedicated-support') && !tierConfig.limits.dedicated_support) {
            return c.json({
                error: 'feature_not_available',
                message: 'Dedicated support is not available in your billing tier'
            }, 403);
        }
        // Check if tenant has exceeded their resource limits
        const limitsCheck = await billingService.isUsageWithinLimits(tenantId);
        if (!limitsCheck.withinLimits && limitsCheck.exceededLimits) {
            return c.json({
                error: 'quota_exceeded',
                message: `Resource limits exceeded: ${limitsCheck.exceededLimits.join(', ')}`,
                limits: limitsCheck.exceededLimits
            }, 403);
        }
        // Proceed with the request if all checks pass
        return await next();
    }
    catch (error) {
        if (error instanceof TenantNotFoundError) {
            return c.json({
                error: 'invalid_request',
                error_description: 'Tenant not found'
            }, 400);
        }
        console.error('Error in feature enforcement middleware:', error);
        return c.json({
            error: 'server_error',
            error_description: 'An error occurred while checking feature availability'
        }, 500);
    }
}
