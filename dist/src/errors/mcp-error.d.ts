/**
 * MCP Error Class
 *
 * Custom error class for MCP gateway errors with standardized error codes,
 * HTTP status codes, and optional details.
 */
export declare class MCPError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, any>;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, any>);
    /**
     * Convert error to JSON format for API responses
     */
    toJSON(): {
        details?: Record<string, any> | undefined;
        error: string;
        error_description: string;
    };
    /**
     * Create error from unknown error type
     */
    static fromUnknown(error: unknown, defaultCode?: string, defaultStatus?: number): MCPError;
}
