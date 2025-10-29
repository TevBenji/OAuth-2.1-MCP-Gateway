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
export declare function proxyToMCPServer(c: Context): Promise<(Response & import("hono").TypedResponse<string | {
    readonly byteLength: number;
    slice: {};
    readonly [Symbol.toStringTag]: "ArrayBuffer";
} | {
    readonly locked: boolean;
    cancel: {};
    getReader: {};
    pipeThrough: {};
    pipeTo: {};
    tee: {};
    values: {};
    [Symbol.asyncIterator]: {};
} | undefined>) | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
/**
 * Handler for proxying requests to MCP servers by resource identifier (RFC 8707)
 * Route: /mcp/resource/*
 */
export declare function proxyByResourceIdentifier(c: Context): Promise<(Response & import("hono").TypedResponse<string | {
    readonly byteLength: number;
    slice: {};
    readonly [Symbol.toStringTag]: "ArrayBuffer";
} | {
    readonly locked: boolean;
    cancel: {};
    getReader: {};
    pipeThrough: {};
    pipeTo: {};
    tee: {};
    values: {};
    [Symbol.asyncIterator]: {};
} | undefined>) | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
