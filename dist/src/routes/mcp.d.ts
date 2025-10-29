/**
 * MCP Gateway Routes
 *
 * All MCP proxy and resource endpoints.
 * Protected with OAuth authentication and rate limiting.
 */
import { Hono } from 'hono';
import type { Bindings } from '../types/bindings';
type Variables = {
    tenantId?: string;
    userId?: string;
    clientId?: string;
    mcpContext?: any;
    tokenPayload?: any;
    session?: any;
};
export declare function createMCPRoutes(createRateLimiter: (env: any) => any): Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, {}, "/">;
export {};
