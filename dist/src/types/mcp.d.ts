/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Type definitions for MCP protocol integration, request proxying,
 * and server registry management.
 */
import { z } from 'zod';
export declare const MCPServerConfigSchema: z.ZodObject<{
    server_id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    name: z.ZodString;
    endpoint_url: z.ZodString;
    resource_identifier: z.ZodString;
    required_scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    health_check_url: z.ZodOptional<z.ZodString>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
    retry_attempts: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "maintenance"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    name: string;
    endpoint_url: string;
    resource_identifier: string;
    status: "active" | "inactive" | "maintenance";
    required_scopes: string[];
    timeout_ms: number;
    retry_attempts: number;
    server_id?: string | undefined;
    health_check_url?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    tenant_id: string;
    name: string;
    endpoint_url: string;
    resource_identifier: string;
    server_id?: string | undefined;
    status?: "active" | "inactive" | "maintenance" | undefined;
    required_scopes?: string[] | undefined;
    health_check_url?: string | undefined;
    timeout_ms?: number | undefined;
    retry_attempts?: number | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export interface MCPRequestContext {
    tenant_id: string;
    user_id: string;
    client_id: string;
    session_id: string;
    scopes: string[];
    device_id?: string;
    ip_address: string;
    user_agent: string;
}
export interface MCPProxyRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string | ArrayBuffer | ReadableStream;
    context: MCPRequestContext;
}
export interface MCPProxyResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: string | ArrayBuffer | ReadableStream;
    latency_ms: number;
}
export interface MCPServerHealth {
    server_id: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    last_check: Date;
    response_time_ms?: number;
    error_message?: string;
    consecutive_failures: number;
}
export declare const MCP_SCOPES: {
    readonly 'mcp:tools:read': "Read access to MCP tools";
    readonly 'mcp:tools:write': "Write access to MCP tools";
    readonly 'mcp:tools:execute': "Execute MCP tools";
    readonly 'mcp:tools:*': "Full access to MCP tools";
    readonly 'mcp:resources:read': "Read access to MCP resources";
    readonly 'mcp:resources:write': "Write access to MCP resources";
    readonly 'mcp:resources:delete': "Delete access to MCP resources";
    readonly 'mcp:resources:*': "Full access to MCP resources";
    readonly 'mcp:servers:read': "Read server information";
    readonly 'mcp:servers:manage': "Manage server configuration";
    readonly 'mcp:admin:read': "Read admin information";
    readonly 'mcp:admin:write': "Write admin configuration";
};
export type MCPScope = keyof typeof MCP_SCOPES;
export interface MCPToolInvocation {
    invocation_id: string;
    tenant_id: string;
    user_id: string;
    server_id: string;
    tool_name: string;
    parameters: Record<string, any>;
    timestamp: Date;
    duration_ms: number;
    success: boolean;
    error_message?: string;
    result_size_bytes?: number;
}
export interface MCPServerRegistryEntry {
    server_id: string;
    tenant_id: string;
    config: MCPServerConfig;
    health: MCPServerHealth;
    created_at: Date;
    updated_at: Date;
    last_accessed: Date;
    access_count: number;
}
export declare const MCPRequestValidationSchema: z.ZodObject<{
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    path: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string> | undefined;
    query?: Record<string, string> | undefined;
    body?: any;
}, {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string> | undefined;
    query?: Record<string, string> | undefined;
    body?: any;
}>;
export type MCPRequestValidation = z.infer<typeof MCPRequestValidationSchema>;
export declare class MCPError extends Error {
    code: string;
    message: string;
    statusCode: number;
    details?: any | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: any | undefined);
}
export declare class MCPServerNotFoundError extends MCPError {
    constructor(serverId: string);
}
export declare class MCPServerUnhealthyError extends MCPError {
    constructor(serverId: string);
}
export declare class MCPScopeInsufficientError extends MCPError {
    constructor(requiredScopes: string[], providedScopes: string[]);
}
