/**
 * Billing and Usage Tracking Middleware
 * 
 * Middleware to track usage for billing purposes on each request
 */

import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
import { UsageTrackingService } from '@/services/billing/usage';

type Variables = {
  tenantId?: string;
  userId?: string;
  clientId?: string;
};

export async function billingMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const startTime = Date.now();
  
  // Extract tenant context from request
  const tenantId = c.req.header('X-Tenant-ID') || 
                  (c.get('tenantId') as string) || 
                  'default';
  
  const userId = c.req.header('X-User-ID') || (c.get('userId') as string);
  const clientId = c.req.header('X-Client-ID') || (c.get('clientId') as string);

  // Continue with the request
  await next();

  try {
    // Create usage tracking service instance
    const usageService = new UsageTrackingService(c.env);
    
    // Determine the action type based on the request path
    let actionType = 'unknown';
    if (c.req.path.includes('/token')) {
      actionType = 'token_request';
    } else if (c.req.path.includes('/authorize')) {
      actionType = 'auth_request';
    } else if (c.req.path.includes('/mcp') || c.req.path.includes('/mcp-server')) {
      actionType = 'mcp_request';
    } else {
      actionType = 'general_request';
    }
    
    // Record the usage after the request is completed
    await usageService.recordUsage({
      tenant_id: tenantId,
      user_id: userId,
      client_id: clientId,
      resource_id: c.req.path, // Use the request path as the resource identifier
      action: actionType,
      metadata: {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        response_time_ms: Date.now() - startTime,
        headers: {
          'content-type': c.req.header('content-type'),
          'user-agent': c.req.header('user-agent'),
        }
      }
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    // Don't let usage tracking errors affect the main request
  }
}