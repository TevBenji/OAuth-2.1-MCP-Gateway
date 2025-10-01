/**
 * MCP Proxy Service
 *
 * Handles request forwarding to upstream MCP servers with tenant context injection,
 * error handling, retry logic, and performance monitoring.
 */
import { MCPProxyRequest, MCPProxyResponse } from '../../types/mcp';
import { MCPServerRegistry } from './registry';
/**
 * Proxy configuration options
 */
export interface ProxyConfig {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    addTenantHeaders?: boolean;
    addAuthHeaders?: boolean;
    preserveHostHeader?: boolean;
}
/**
 * MCP Proxy Service
 */
export declare class MCPProxyService {
    private registry;
    private defaultConfig;
    constructor(registry: MCPServerRegistry, config?: ProxyConfig);
    /**
     * Forward request to upstream MCP server with tenant context
     */
    forwardRequest(serverId: string, request: MCPProxyRequest, config?: ProxyConfig): Promise<MCPProxyResponse>;
    /**
     * Forward request by resource identifier (RFC 8707)
     */
    forwardRequestByResource(resourceIdentifier: string, request: MCPProxyRequest, config?: ProxyConfig): Promise<MCPProxyResponse>;
    /**
     * Build target URL for upstream server
     */
    private buildTargetUrl;
    /**
     * Build request headers with tenant context injection
     */
    private buildRequestHeaders;
    /**
     * Perform HTTP request with retry logic
     */
    private performRequestWithRetry;
    /**
     * Extract response headers
     */
    private extractResponseHeaders;
    /**
     * Extract response body
     */
    private extractResponseBody;
    /**
     * Join URL paths correctly
     */
    private joinPaths;
    /**
     * Delay helper for retry logic
     */
    private delay;
}
