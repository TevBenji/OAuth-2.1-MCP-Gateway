/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * This is the main entry point for the Cloudflare Workers runtime.
 * It sets up the Hono application with all middleware and routes.
 */
import { Hono } from 'hono';
import type { Bindings } from './types/bindings';
declare const app: Hono<{
    Bindings: Bindings;
}, {}, "/">;
export default app;
