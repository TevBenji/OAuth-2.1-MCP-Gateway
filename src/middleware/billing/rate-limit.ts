/**
 * Billing-aware Rate Limiting Middleware
 * 
 * Rate limiting that takes billing tier into account
 */

import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
import { BillingService } from '@/services/billing/billing';
import { TenantNotFoundError } from '@/types/tenant';

export async function billingRateLimitMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const tenantId = c.req.header('X-Tenant-ID') || 
                  (c.get('tenantId') as string) || 
                  'default';

  try {
    const billingService = new BillingService(c.env);
    
    // Check if the tenant is within their usage limits
    const limitsCheck = await billingService.enforceUsageLimits(tenantId);
    
    if (!limitsCheck.allowed) {
      return c.json(
        { 
          error: 'quota_exceeded', 
          message: `Usage limit exceeded: ${limitsCheck.reason}` 
        }, 
        429
      );
    }
    
    // Proceed with the request if within limits
    await next();
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return c.json(
        { 
          error: 'invalid_request', 
          error_description: 'Tenant not found' 
        }, 
        400
      );
    }
    
    console.error('Error in billing rate limit middleware:', error);
    return c.json(
      { 
        error: 'server_error', 
        error_description: 'An error occurred while checking usage limits' 
      }, 
      500
    );
  }
}