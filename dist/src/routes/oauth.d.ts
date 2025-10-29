/**
 * OAuth 2.1 Routes
 *
 * Hono routes for OAuth 2.1 endpoints with proper error handling and validation.
 */
import { Hono } from 'hono';
import { Bindings } from '../types/bindings';
type Variables = {
    tenantId?: string;
    userId?: string;
    clientId?: string;
    mcpContext?: any;
    tokenPayload?: any;
    session?: any;
    deviceInfo?: any;
};
declare const oauth: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, {}, "/">;
export default oauth;
