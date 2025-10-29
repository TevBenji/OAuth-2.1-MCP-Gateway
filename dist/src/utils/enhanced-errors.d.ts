/**
 * Enhanced Error System
 *
 * Provides user-friendly error messages with actionable guidance,
 * documentation links, and resolution steps.
 */
export interface ErrorGuidance {
    userMessage: string;
    technicalDetails?: string;
    resolution: string[];
    documentation?: string;
    supportContact?: string;
}
export interface OAuthErrorOptions {
    error: string;
    error_description: string;
    error_uri?: string;
    state?: string;
    guidance?: ErrorGuidance;
    statusCode?: number;
}
/**
 * Enhanced OAuth Error Class
 *
 * Extends standard OAuth errors with user guidance and resolution steps
 */
export declare class OAuthError extends Error {
    readonly error: string;
    readonly error_description: string;
    readonly error_uri?: string;
    readonly state?: string;
    readonly guidance?: ErrorGuidance;
    readonly statusCode: number;
    constructor(options: OAuthErrorOptions);
    /**
     * Convert to OAuth 2.1 compliant error response
     */
    toOAuthResponse(): {
        state?: string | undefined;
        error_uri?: string | undefined;
        error: string;
        error_description: string;
    };
    /**
     * Convert to enhanced JSON response with guidance
     */
    toJSON(): {
        guidance?: {
            support?: string | undefined;
            documentation?: string | undefined;
            resolution_steps: string[];
            technical_details?: string | undefined;
            user_message: string;
        } | undefined;
        state?: string | undefined;
        error_uri?: string | undefined;
        error: string;
        error_description: string;
    };
}
/**
 * Common OAuth Error Factory Functions
 */
export declare const createInvalidRequestError: (details: string, state?: string) => OAuthError;
export declare const createUnauthorizedClientError: (reason: string, state?: string) => OAuthError;
export declare const createAccessDeniedError: (reason: string, state?: string) => OAuthError;
export declare const createUnsupportedResponseTypeError: (responseType: string, state?: string) => OAuthError;
export declare const createInvalidScopeError: (scope: string, state?: string) => OAuthError;
export declare const createServerError: (details: string) => OAuthError;
export declare const createTemporarilyUnavailableError: (reason: string) => OAuthError;
/**
 * PKCE-specific errors
 */
export declare const createInvalidPKCEError: (reason: string, state?: string) => OAuthError;
/**
 * Token-specific errors
 */
export declare const createInvalidGrantError: (reason: string) => OAuthError;
export declare const createInvalidClientError: (reason: string) => OAuthError;
export declare const createUnsupportedGrantTypeError: (grantType: string) => OAuthError;
/**
 * Rate Limiting Errors
 */
export declare const createRateLimitError: (retryAfter: number) => OAuthError;
