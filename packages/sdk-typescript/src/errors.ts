/**
 * SDK Error Classes
 */

/**
 * Base OAuth error
 */
export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public description?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/**
 * Invalid request error
 */
export class InvalidRequestError extends OAuthError {
  constructor(description: string) {
    super('Invalid request', 'invalid_request', description, 400);
    this.name = 'InvalidRequestError';
  }
}

/**
 * Invalid client error
 */
export class InvalidClientError extends OAuthError {
  constructor(description: string) {
    super('Invalid client', 'invalid_client', description, 401);
    this.name = 'InvalidClientError';
  }
}

/**
 * Invalid grant error
 */
export class InvalidGrantError extends OAuthError {
  constructor(description: string) {
    super('Invalid grant', 'invalid_grant', description, 400);
    this.name = 'InvalidGrantError';
  }
}

/**
 * Unauthorized client error
 */
export class UnauthorizedClientError extends OAuthError {
  constructor(description: string) {
    super('Unauthorized client', 'unauthorized_client', description, 400);
    this.name = 'UnauthorizedClientError';
  }
}

/**
 * Unsupported grant type error
 */
export class UnsupportedGrantTypeError extends OAuthError {
  constructor(description: string) {
    super('Unsupported grant type', 'unsupported_grant_type', description, 400);
    this.name = 'UnsupportedGrantTypeError';
  }
}

/**
 * Invalid scope error
 */
export class InvalidScopeError extends OAuthError {
  constructor(description: string) {
    super('Invalid scope', 'invalid_scope', description, 400);
    this.name = 'InvalidScopeError';
  }
}

/**
 * Access denied error
 */
export class AccessDeniedError extends OAuthError {
  constructor(description: string) {
    super('Access denied', 'access_denied', description, 403);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Network error
 */
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends OAuthError {
  constructor() {
    super('Token expired', 'token_expired', 'The access token has expired', 401);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Parse OAuth error from response
 */
export function parseOAuthError(error: any): OAuthError {
  const code = error.error || 'unknown_error';
  const description = error.error_description || 'An unknown error occurred';
  const statusCode = error.status || 400;

  switch (code) {
    case 'invalid_request':
      return new InvalidRequestError(description);
    case 'invalid_client':
      return new InvalidClientError(description);
    case 'invalid_grant':
      return new InvalidGrantError(description);
    case 'unauthorized_client':
      return new UnauthorizedClientError(description);
    case 'unsupported_grant_type':
      return new UnsupportedGrantTypeError(description);
    case 'invalid_scope':
      return new InvalidScopeError(description);
    case 'access_denied':
      return new AccessDeniedError(description);
    default:
      return new OAuthError('OAuth error', code, description, statusCode);
  }
}
