/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * Simplified entry point using modular routes and DI container.
 * This file orchestrates the application but delegates implementation to modules.
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
