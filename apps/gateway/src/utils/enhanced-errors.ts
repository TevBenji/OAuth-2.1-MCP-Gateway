/**
 * Enhanced Error System
 *
 * Provides user-friendly error messages with actionable guidance,
 * documentation links, and resolution steps.
 */

export interface ErrorGuidance {
  userMessage: string; // User-friendly error message
  technicalDetails?: string; // Technical explanation for developers
  resolution: string[]; // Step-by-step resolution steps
  documentation?: string; // Link to relevant documentation
  supportContact?: string; // Support contact information
}

export interface OAuthErrorOptions {
  error: string; // OAuth 2.1 error code
  error_description: string; // Error description
  error_uri?: string; // URI with error documentation
  state?: string; // OAuth state parameter
  guidance?: ErrorGuidance; // Enhanced user guidance
  statusCode?: number; // HTTP status code
}

/**
 * Enhanced OAuth Error Class
 *
 * Extends standard OAuth errors with user guidance and resolution steps
 */
export class OAuthError extends Error {
  public readonly error: string;
  public readonly error_description: string;
  public readonly error_uri?: string;
  public readonly state?: string;
  public readonly guidance?: ErrorGuidance;
  public readonly statusCode: number;

  constructor(options: OAuthErrorOptions) {
    super(options.error_description);
    this.name = 'OAuthError';
    this.error = options.error;
    this.error_description = options.error_description;
    this.error_uri = options.error_uri;
    this.state = options.state;
    this.guidance = options.guidance;
    this.statusCode = options.statusCode || 400;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OAuthError);
    }
  }

  /**
   * Convert to OAuth 2.1 compliant error response
   */
  toOAuthResponse() {
    return {
      error: this.error,
      error_description: this.error_description,
      ...(this.error_uri && { error_uri: this.error_uri }),
      ...(this.state && { state: this.state }),
    };
  }

  /**
   * Convert to enhanced JSON response with guidance
   */
  toJSON() {
    return {
      ...this.toOAuthResponse(),
      ...(this.guidance && {
        guidance: {
          user_message: this.guidance.userMessage,
          ...(this.guidance.technicalDetails && { technical_details: this.guidance.technicalDetails }),
          resolution_steps: this.guidance.resolution,
          ...(this.guidance.documentation && { documentation: this.guidance.documentation }),
          ...(this.guidance.supportContact && { support: this.guidance.supportContact }),
        },
      }),
    };
  }
}

/**
 * Common OAuth Error Factory Functions
 */

export const createInvalidRequestError = (details: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'invalid_request',
    error_description: `Invalid request: ${details}`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/invalid-request`,
    state,
    statusCode: 400,
    guidance: {
      userMessage: 'The request is missing required parameters or contains invalid values.',
      technicalDetails: details,
      resolution: [
        'Check that all required parameters are included in your request',
        'Verify parameter values match the expected format',
        'Review the OAuth 2.1 specification for this endpoint',
        'Check your application logs for more specific error details',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/authorization`,
      supportContact: 'https://support.example.com',
    },
  });
};

export const createUnauthorizedClientError = (reason: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'unauthorized_client',
    error_description: `Client is not authorized: ${reason}`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/unauthorized-client`,
    state,
    statusCode: 401,
    guidance: {
      userMessage: 'Your application is not authorized to perform this action.',
      technicalDetails: reason,
      resolution: [
        'Verify your client_id is correct and registered',
        'Check that your redirect_uri matches the registered URI exactly',
        'Ensure your client has the necessary permissions/scopes',
        'Confirm your client application type supports this grant flow',
        'Check if your client credentials are active and not expired',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/client-registration`,
      supportContact: 'https://support.example.com',
    },
  });
};

export const createAccessDeniedError = (reason: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'access_denied',
    error_description: reason,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/access-denied`,
    state,
    statusCode: 403,
    guidance: {
      userMessage: 'Access was denied by the resource owner or authorization server.',
      technicalDetails: reason,
      resolution: [
        'If user denied consent, request authorization again with clear explanation',
        'Check if the requested scopes are allowed for your client',
        'Verify your account has necessary permissions',
        'Contact administrator if you believe this is an error',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/scopes`,
    },
  });
};

export const createUnsupportedResponseTypeError = (responseType: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'unsupported_response_type',
    error_description: `Response type '${responseType}' is not supported`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/unsupported-response-type`,
    state,
    statusCode: 400,
    guidance: {
      userMessage: 'The requested response type is not supported.',
      technicalDetails: `Attempted to use unsupported response_type: ${responseType}`,
      resolution: [
        'Use "code" for authorization code flow (recommended)',
        'Check your OAuth 2.1 flow implementation',
        'Verify your application type supports the desired flow',
        'Review supported grant types in the discovery document at /.well-known/oauth-authorization-server',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/flows`,
    },
  });
};

export const createInvalidScopeError = (scope: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'invalid_scope',
    error_description: `Invalid or unknown scope: ${scope}`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/invalid-scope`,
    state,
    statusCode: 400,
    guidance: {
      userMessage: 'One or more requested scopes are invalid or not available.',
      technicalDetails: `Requested invalid scope: ${scope}`,
      resolution: [
        'Check the list of available scopes in the documentation',
        'Verify scope names are spelled correctly',
        'Ensure your client is authorized to request these scopes',
        'Request only the minimum scopes needed for your application',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/scopes`,
    },
  });
};

export const createServerError = (details: string): OAuthError => {
  return new OAuthError({
    error: 'server_error',
    error_description: 'The authorization server encountered an unexpected error',
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/server-error`,
    statusCode: 500,
    guidance: {
      userMessage: 'An unexpected error occurred on the server. Please try again.',
      technicalDetails: details,
      resolution: [
        'Try your request again after a brief wait',
        'Check the service status page for any ongoing incidents',
        'If the problem persists, contact technical support with error details',
        'Include timestamp and any error codes in your support request',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/troubleshooting`,
      supportContact: 'https://support.example.com',
    },
  });
};

export const createTemporarilyUnavailableError = (reason: string): OAuthError => {
  return new OAuthError({
    error: 'temporarily_unavailable',
    error_description: `Service temporarily unavailable: ${reason}`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/temporarily-unavailable`,
    statusCode: 503,
    guidance: {
      userMessage: 'The service is temporarily unavailable. Please try again shortly.',
      technicalDetails: reason,
      resolution: [
        'Wait a few minutes and retry your request',
        'Implement exponential backoff in your retry logic',
        'Check the service status page',
        'Subscribe to status updates for maintenance notifications',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/best-practices/retry-logic`,
    },
  });
};

/**
 * PKCE-specific errors
 */

export const createInvalidPKCEError = (reason: string, state?: string): OAuthError => {
  return new OAuthError({
    error: 'invalid_request',
    error_description: `PKCE validation failed: ${reason}`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/invalid-pkce`,
    state,
    statusCode: 400,
    guidance: {
      userMessage: 'The PKCE code challenge validation failed.',
      technicalDetails: reason,
      resolution: [
        'Ensure code_challenge is included in authorization request',
        'Verify code_verifier is included in token request',
        'Check that code_challenge_method is "S256" (SHA-256)',
        'Confirm the code_verifier used matches the original code_challenge',
        'Use a reliable PKCE library to generate challenge/verifier pairs',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/pkce`,
    },
  });
};

/**
 * Token-specific errors
 */

export const createInvalidGrantError = (reason: string): OAuthError => {
  return new OAuthError({
    error: 'invalid_grant',
    error_description: reason,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/invalid-grant`,
    statusCode: 400,
    guidance: {
      userMessage: 'The provided authorization grant is invalid, expired, or revoked.',
      technicalDetails: reason,
      resolution: [
        'Verify the authorization code has not expired (typically valid for 10 minutes)',
        'Ensure the authorization code has not been used before',
        'Check that redirect_uri matches the one used in authorization request',
        'Confirm the code was issued to your client_id',
        'Start a new authorization flow if the code is no longer valid',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/token-exchange`,
    },
  });
};

export const createInvalidClientError = (reason: string): OAuthError => {
  return new OAuthError({
    error: 'invalid_client',
    error_description: reason,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/invalid-client`,
    statusCode: 401,
    guidance: {
      userMessage: 'Client authentication failed.',
      technicalDetails: reason,
      resolution: [
        'Verify your client_id is correct',
        'Check that your client_secret matches the registered value',
        'Ensure credentials are being sent correctly (Authorization header or request body)',
        'Confirm your client is active and not suspended',
        'Regenerate credentials if they may have been compromised',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/client-authentication`,
      supportContact: 'https://support.example.com',
    },
  });
};

export const createUnsupportedGrantTypeError = (grantType: string): OAuthError => {
  return new OAuthError({
    error: 'unsupported_grant_type',
    error_description: `Grant type '${grantType}' is not supported`,
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/unsupported-grant-type`,
    statusCode: 400,
    guidance: {
      userMessage: 'The requested grant type is not supported.',
      technicalDetails: `Attempted grant_type: ${grantType}`,
      resolution: [
        'Use "authorization_code" for standard OAuth flow',
        'Use "refresh_token" to refresh access tokens',
        'Check supported grant types in discovery document',
        'Verify your client is configured for the desired grant type',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/oauth/grant-types`,
    },
  });
};

/**
 * Rate Limiting Errors
 */

export const createRateLimitError = (retryAfter: number): OAuthError => {
  return new OAuthError({
    error: 'temporarily_unavailable',
    error_description: 'Rate limit exceeded. Please slow down your requests.',
    error_uri: `${process.env.PUBLIC_URL || ''}/docs/errors/rate-limit`,
    statusCode: 429,
    guidance: {
      userMessage: 'You have exceeded the rate limit. Please wait before making more requests.',
      technicalDetails: `Retry after ${retryAfter} seconds`,
      resolution: [
        `Wait ${retryAfter} seconds before retrying`,
        'Implement exponential backoff in your retry logic',
        'Cache responses when possible to reduce API calls',
        'Review your application logic to minimize unnecessary requests',
        'Contact support if you need higher rate limits',
      ],
      documentation: `${process.env.PUBLIC_URL || ''}/docs/rate-limiting`,
      supportContact: 'https://support.example.com',
    },
  });
};
