/**
 * Enhanced Error Handler Middleware
 *
 * Formats errors with user-friendly messages, resolution steps,
 * and proper HTTP status codes according to OAuth 2.1 spec.
 */
export interface ErrorResponse {
    error: string;
    error_description: string;
    error_uri?: string;
    state?: string;
    guidance?: {
        user_message: string;
        technical_details?: string;
        resolution_steps: string[];
        documentation?: string;
        support?: string;
    };
    timestamp: string;
    request_id?: string;
}
/**
 * Format error response for OAuth 2.1 compliance with enhanced guidance
 */
export declare function formatErrorResponse(error: unknown, requestId?: string, includeGuidance?: boolean): {
    response: ErrorResponse;
    statusCode: number;
};
/**
 * Error Handler for Cloudflare Workers
 */
export declare function handleError(error: unknown, request: Request, includeGuidance?: boolean): Promise<Response>;
/**
 * Wrap handler function with error handling
 */
export declare function withErrorHandler(handler: (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>): (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>;
