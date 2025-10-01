/**
 * MCP Proxy Request Handler
 *
 * HTTP handlers for proxying requests to upstream MCP servers.
 * Supports both server ID and resource identifier routing.
 */
import { Context } from 'hono';
/**
 * Handler for proxying requests to MCP servers by server ID
 * Route: /mcp/:serverId/*
 */
export declare function proxyToMCPServer(c: Context): Promise<Response>;
/**
 * Handler for proxying requests to MCP servers by resource identifier (RFC 8707)
 * Route: /mcp/resource/*
 */
export declare function proxyByResourceIdentifier(c: Context): Promise<Response>;
