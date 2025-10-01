/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Type definitions for MCP protocol integration, request proxying,
 * and server registry management.
 */
import { z } from 'zod';
// MCP Server Configuration
export const MCPServerConfigSchema = z.object({
    server_id: z.string().uuid().optional(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    endpoint_url: z.string().url(),
    resource_identifier: z.string().min(1), // For RFC 8707 Resource Indicators
    required_scopes: z.array(z.string()).default([]),
    health_check_url: z.string().url().optional(),
    timeout_ms: z.number().int().positive().default(30000),
    retry_attempts: z.number().int().min(0).max(5).default(3),
    status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
    metadata: z.record(z.string(), z.any()).optional()
});
// MCP Scope Definitions
export const MCP_SCOPES = {
    // Tool access scopes
    'mcp:tools:read': 'Read access to MCP tools',
    'mcp:tools:write': 'Write access to MCP tools',
    'mcp:tools:execute': 'Execute MCP tools',
    'mcp:tools:*': 'Full access to MCP tools',
    // Resource access scopes
    'mcp:resources:read': 'Read access to MCP resources',
    'mcp:resources:write': 'Write access to MCP resources',
    'mcp:resources:delete': 'Delete access to MCP resources',
    'mcp:resources:*': 'Full access to MCP resources',
    // Server management scopes
    'mcp:servers:read': 'Read server information',
    'mcp:servers:manage': 'Manage server configuration',
    // Admin scopes
    'mcp:admin:read': 'Read admin information',
    'mcp:admin:write': 'Write admin configuration'
};
// MCP Request Validation Schema
export const MCPRequestValidationSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string().min(1),
    headers: z.record(z.string(), z.string()).optional(),
    query: z.record(z.string(), z.string()).optional(),
    body: z.any().optional()
});
// MCP Error Types
export class MCPError extends Error {
    code;
    message;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'MCPError';
    }
}
export class MCPServerNotFoundError extends MCPError {
    constructor(serverId) {
        super('MCP_SERVER_NOT_FOUND', `MCP server not found: ${serverId}`, 404);
    }
}
export class MCPServerUnhealthyError extends MCPError {
    constructor(serverId) {
        super('MCP_SERVER_UNHEALTHY', `MCP server is unhealthy: ${serverId}`, 503);
    }
}
export class MCPScopeInsufficientError extends MCPError {
    constructor(requiredScopes, providedScopes) {
        super('MCP_INSUFFICIENT_SCOPE', `Insufficient scope. Required: ${requiredScopes.join(', ')}, Provided: ${providedScopes.join(', ')}`, 403);
    }
}
