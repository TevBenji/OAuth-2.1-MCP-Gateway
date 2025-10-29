/**
 * OAuth 2.1 Dynamic Client Registration Handler (RFC 7591)
 *
 * Implements the POST /register endpoint for automatic client onboarding
 * with secure client_id generation and optional client_secret.
 */
import { Context } from 'hono';
/**
 * POST /register endpoint for Dynamic Client Registration
 * Implements RFC 7591 with security validations
 */
export declare const registerClient: (c: Context) => Promise<Response & import("hono").TypedResponse<any>>;
/**
 * CORS preflight handler for client registration
 */
export declare const registerPreflight: (c: Context) => Promise<Response>;
