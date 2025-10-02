/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * This is the main entry point for the Cloudflare Workers runtime.
 * It sets up the Hono application with all middleware and routes.
 */
import { Hono } from 'hono';
import type { Bindings } from './types/bindings';
type Variables = {
    tenantId?: string;
    userId?: string;
    clientId?: string;
    mcpContext?: any;
    tokenPayload?: any;
    session?: any;
    deviceInfo?: any;
};
declare const app: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, {}, "/">;
export default app;
