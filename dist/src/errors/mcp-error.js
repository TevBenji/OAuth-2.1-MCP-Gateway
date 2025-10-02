/**
 * MCP Error Class
 *
 * Custom error class for MCP gateway errors with standardized error codes,
 * HTTP status codes, and optional details.
 */
export class MCPError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        // Maintains proper stack trace for where error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MCPError);
        }
    }
    /**
     * Convert error to JSON format for API responses
     */
    toJSON() {
        return {
            error: this.code,
            error_description: this.message,
            ...(this.details && { details: this.details }),
        };
    }
    /**
     * Create error from unknown error type
     */
    static fromUnknown(error, defaultCode = 'INTERNAL_ERROR', defaultStatus = 500) {
        if (error instanceof MCPError) {
            return error;
        }
        if (error instanceof Error) {
            return new MCPError(defaultCode, error.message, defaultStatus);
        }
        return new MCPError(defaultCode, typeof error === 'string' ? error : 'An unknown error occurred', defaultStatus);
    }
}
