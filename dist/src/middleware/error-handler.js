/**
 * Enhanced Error Handler Middleware
 *
 * Formats errors with user-friendly messages, resolution steps,
 * and proper HTTP status codes according to OAuth 2.1 spec.
 */
import { OAuthError } from '../utils/enhanced-errors';
import { MCPError } from '../errors/mcp-error';
/**
 * Format error response for OAuth 2.1 compliance with enhanced guidance
 */
export function formatErrorResponse(error, requestId, includeGuidance = true) {
    const timestamp = new Date().toISOString();
    // Handle OAuthError with enhanced guidance
    if (error instanceof OAuthError) {
        return {
            response: {
                error: error.error,
                error_description: error.error_description,
                ...(error.error_uri && { error_uri: error.error_uri }),
                ...(error.state && { state: error.state }),
                ...(includeGuidance && error.guidance && {
                    guidance: {
                        user_message: error.guidance.userMessage,
                        ...(error.guidance.technicalDetails && {
                            technical_details: error.guidance.technicalDetails,
                        }),
                        resolution_steps: error.guidance.resolution,
                        ...(error.guidance.documentation && { documentation: error.guidance.documentation }),
                        ...(error.guidance.supportContact && { support: error.guidance.supportContact }),
                    },
                }),
                timestamp,
                ...(requestId && { request_id: requestId }),
            },
            statusCode: error.statusCode,
        };
    }
    // Handle MCPError
    if (error instanceof MCPError) {
        return {
            response: {
                error: error.code,
                error_description: error.message,
                ...(error.details && includeGuidance && {
                    guidance: {
                        user_message: 'An error occurred while processing your request.',
                        technical_details: JSON.stringify(error.details),
                        resolution_steps: [
                            'Check your request parameters',
                            'Verify your authentication credentials',
                            'Review the error details below',
                            'Contact support if the issue persists',
                        ],
                        documentation: `${process.env.PUBLIC_URL || ''}/docs/troubleshooting`,
                    },
                }),
                timestamp,
                ...(requestId && { request_id: requestId }),
            },
            statusCode: error.statusCode,
        };
    }
    // Handle standard Error
    if (error instanceof Error) {
        return {
            response: {
                error: 'server_error',
                error_description: error.message || 'An unexpected error occurred',
                ...(includeGuidance && {
                    guidance: {
                        user_message: 'An unexpected error occurred. Please try again.',
                        technical_details: error.message,
                        resolution_steps: [
                            'Try your request again after a brief wait',
                            'Check the service status page',
                            'Contact technical support if the problem persists',
                            'Include the request_id in your support request',
                        ],
                        documentation: `${process.env.PUBLIC_URL || ''}/docs/troubleshooting`,
                        support: 'https://support.example.com',
                    },
                }),
                timestamp,
                ...(requestId && { request_id: requestId }),
            },
            statusCode: 500,
        };
    }
    // Handle unknown error type
    return {
        response: {
            error: 'server_error',
            error_description: 'An unknown error occurred',
            ...(includeGuidance && {
                guidance: {
                    user_message: 'An unexpected error occurred. Please try again.',
                    resolution_steps: [
                        'Try your request again',
                        'Contact technical support',
                        'Include the request_id and timestamp in your support request',
                    ],
                    documentation: `${process.env.PUBLIC_URL || ''}/docs/troubleshooting`,
                    support: 'https://support.example.com',
                },
            }),
            timestamp,
            ...(requestId && { request_id: requestId }),
        },
        statusCode: 500,
    };
}
/**
 * Error Handler for Cloudflare Workers
 */
export async function handleError(error, request, includeGuidance = true) {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();
    // Log error for monitoring (replace with actual logging service)
    console.error('Error occurred:', {
        requestId,
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    // Format error response
    const { response, statusCode } = formatErrorResponse(error, requestId, includeGuidance);
    // Determine response content type based on request
    const acceptHeader = request.headers.get('accept') || '';
    const isJsonRequest = acceptHeader.includes('application/json') ||
        request.url.includes('/api/') ||
        request.url.includes('/oauth/');
    if (isJsonRequest) {
        // Return JSON error response
        return new Response(JSON.stringify(response, null, 2), {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'X-Request-ID': requestId,
            },
        });
    }
    else {
        // Return HTML error page for browser requests
        const htmlResponse = generateErrorPage(response, statusCode);
        return new Response(htmlResponse, {
            status: statusCode,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'X-Request-ID': requestId,
            },
        });
    }
}
/**
 * Generate HTML error page with enhanced guidance
 */
function generateErrorPage(errorResponse, statusCode) {
    const { error, error_description, guidance, timestamp, request_id } = errorResponse;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error ${statusCode} - ${error}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .error-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        .error-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #fee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        h1 {
            color: #e53e3e;
            font-size: 24px;
            margin-bottom: 12px;
            text-align: center;
        }
        .error-code {
            color: #718096;
            font-size: 14px;
            text-align: center;
            margin-bottom: 24px;
        }
        .user-message {
            background: #f7fafc;
            border-left: 4px solid #4299e1;
            padding: 16px;
            margin-bottom: 24px;
            border-radius: 4px;
        }
        .user-message h2 {
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 8px;
        }
        .user-message p {
            color: #4a5568;
            font-size: 14px;
            line-height: 1.6;
        }
        .resolution-steps {
            margin-bottom: 24px;
        }
        .resolution-steps h3 {
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 12px;
        }
        .resolution-steps ol {
            margin-left: 20px;
        }
        .resolution-steps li {
            color: #4a5568;
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 8px;
        }
        .technical-details {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 16px;
        }
        .technical-details h4 {
            color: #718096;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .technical-details code {
            color: #2d3748;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            display: block;
            word-wrap: break-word;
        }
        .links {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .link-button {
            display: inline-flex;
            align-items: center;
            padding: 10px 16px;
            background: #4299e1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        .link-button:hover {
            background: #3182ce;
        }
        .link-button.secondary {
            background: #e2e8f0;
            color: #2d3748;
        }
        .link-button.secondary:hover {
            background: #cbd5e0;
        }
        .footer {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #a0aec0;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h1>${error_description}</h1>
        <div class="error-code">Error Code: ${error} (HTTP ${statusCode})</div>

        ${guidance ? `
        <div class="user-message">
            <h2>What happened?</h2>
            <p>${guidance.user_message}</p>
        </div>

        ${guidance.resolution_steps && guidance.resolution_steps.length > 0 ? `
        <div class="resolution-steps">
            <h3>How to resolve this:</h3>
            <ol>
                ${guidance.resolution_steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        ` : ''}

        ${guidance.technical_details ? `
        <details class="technical-details">
            <summary style="cursor: pointer; font-weight: 500; color: #4a5568;">Technical Details</summary>
            <div style="margin-top: 12px;">
                <code>${guidance.technical_details}</code>
            </div>
        </details>
        ` : ''}

        <div class="links">
            ${guidance.documentation ? `
            <a href="${guidance.documentation}" class="link-button">View Documentation</a>
            ` : ''}
            ${guidance.support ? `
            <a href="${guidance.support}" class="link-button secondary">Contact Support</a>
            ` : ''}
        </div>
        ` : ''}

        <div class="footer">
            <div>Request ID: ${request_id || 'N/A'}</div>
            <div>Timestamp: ${timestamp}</div>
        </div>
    </div>
</body>
</html>
  `.trim();
}
/**
 * Wrap handler function with error handling
 */
export function withErrorHandler(handler) {
    return async (request, env, ctx) => {
        try {
            return await handler(request, env, ctx);
        }
        catch (error) {
            return handleError(error, request);
        }
    };
}
