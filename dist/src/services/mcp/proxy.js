/**
 * MCP Proxy Service
 *
 * Handles request forwarding to upstream MCP servers with tenant context injection,
 * error handling, retry logic, and performance monitoring.
 */
import { MCPError, } from '../../types/mcp';
/**
 * MCP Proxy Service
 */
export class MCPProxyService {
    registry;
    defaultConfig;
    constructor(registry, config) {
        this.registry = registry;
        this.defaultConfig = {
            maxRetries: config?.maxRetries ?? 3,
            retryDelay: config?.retryDelay ?? 1000,
            timeout: config?.timeout ?? 30000,
            addTenantHeaders: config?.addTenantHeaders ?? true,
            addAuthHeaders: config?.addAuthHeaders ?? true,
            preserveHostHeader: config?.preserveHostHeader ?? false,
        };
    }
    /**
     * Forward request to upstream MCP server with tenant context
     */
    async forwardRequest(serverId, request, config) {
        const proxyConfig = { ...this.defaultConfig, ...config };
        const context = request.context;
        // Validate server is accessible
        const server = await this.registry.validateServerForRequest(serverId, context.tenant_id, context.scopes);
        // Record access for metrics
        await this.registry.recordAccess(serverId, context.tenant_id);
        // Build target URL
        const targetUrl = this.buildTargetUrl(server, request.url);
        // Build request headers with tenant context
        const headers = this.buildRequestHeaders(request, context, proxyConfig);
        // Perform request with retry logic
        return this.performRequestWithRetry(targetUrl, request.method, headers, request.body, server, proxyConfig);
    }
    /**
     * Forward request by resource identifier (RFC 8707)
     */
    async forwardRequestByResource(resourceIdentifier, request, config) {
        const context = request.context;
        // Find server by resource identifier
        const server = await this.registry.getServerByResource(resourceIdentifier, context.tenant_id);
        // Use the server ID to forward the request
        return this.forwardRequest(server.server_id, request, config);
    }
    /**
     * Build target URL for upstream server
     */
    buildTargetUrl(server, requestPath) {
        const baseUrl = server.config.endpoint_url;
        const url = new URL(baseUrl);
        // Extract path from request URL if it's a full URL
        let path = requestPath;
        try {
            const requestUrl = new URL(requestPath);
            path = requestUrl.pathname + requestUrl.search;
        }
        catch {
            // Not a full URL, use as-is
        }
        // Combine base URL with request path
        url.pathname = this.joinPaths(url.pathname, path);
        return url.toString();
    }
    /**
     * Build request headers with tenant context injection
     */
    buildRequestHeaders(request, context, config) {
        const headers = { ...request.headers };
        // Add tenant context headers
        if (config.addTenantHeaders) {
            headers['X-Tenant-ID'] = context.tenant_id;
            headers['X-User-ID'] = context.user_id;
            headers['X-Client-ID'] = context.client_id;
            headers['X-Session-ID'] = context.session_id;
            if (context.device_id) {
                headers['X-Device-ID'] = context.device_id;
            }
            // Add scope information
            if (context.scopes.length > 0) {
                headers['X-OAuth-Scopes'] = context.scopes.join(' ');
            }
        }
        // Add forwarding headers for tracking
        headers['X-Forwarded-For'] = context.ip_address;
        headers['X-Forwarded-Proto'] = 'https';
        headers['X-Real-IP'] = context.ip_address;
        // Remove host header unless preserving is requested
        if (!config.preserveHostHeader) {
            delete headers['host'];
            delete headers['Host'];
        }
        // Remove authorization header if not forwarding auth
        if (!config.addAuthHeaders) {
            delete headers['authorization'];
            delete headers['Authorization'];
        }
        // Ensure content-type is set for requests with body
        if (request.body && !headers['content-type'] && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }
    /**
     * Perform HTTP request with retry logic
     */
    async performRequestWithRetry(url, method, headers, body, server, config) {
        const maxRetries = Math.min(config.maxRetries, server.config.retry_attempts);
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const startTime = Date.now();
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), server.config.timeout_ms || config.timeout);
                // Perform request
                const response = await fetch(url, {
                    method,
                    headers,
                    body: body,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                const latency = Date.now() - startTime;
                // Build response
                const proxyResponse = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: this.extractResponseHeaders(response),
                    body: await this.extractResponseBody(response),
                    latency_ms: latency,
                };
                // If response is successful, return immediately
                if (response.ok) {
                    return proxyResponse;
                }
                // For client errors (4xx), don't retry
                if (response.status >= 400 && response.status < 500) {
                    return proxyResponse;
                }
                // For server errors (5xx), retry if attempts remain
                if (attempt < maxRetries) {
                    lastError = new Error(`Upstream server returned ${response.status}: ${response.statusText}`);
                    await this.delay(config.retryDelay * (attempt + 1));
                    continue;
                }
                return proxyResponse;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                // If this was the last attempt, throw the error
                if (attempt >= maxRetries) {
                    throw new MCPError('UPSTREAM_REQUEST_FAILED', `Failed to forward request to upstream server after ${maxRetries + 1} attempts: ${lastError.message}`, 502, { server_id: server.server_id, attempts: attempt + 1 });
                }
                // Wait before retrying with exponential backoff
                await this.delay(config.retryDelay * Math.pow(2, attempt));
            }
        }
        // This should never be reached, but TypeScript requires it
        throw new MCPError('UPSTREAM_REQUEST_FAILED', `Failed to forward request to upstream server: ${lastError?.message || 'Unknown error'}`, 502, { server_id: server.server_id });
    }
    /**
     * Extract response headers
     */
    extractResponseHeaders(response) {
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        return headers;
    }
    /**
     * Extract response body
     */
    async extractResponseBody(response) {
        const contentType = response.headers.get('content-type') || '';
        // Handle JSON responses
        if (contentType.includes('application/json')) {
            const text = await response.text();
            return text;
        }
        // Handle text responses
        if (contentType.includes('text/')) {
            return await response.text();
        }
        // Handle binary responses
        if (contentType.includes('application/octet-stream') || contentType.includes('multipart/')) {
            return await response.arrayBuffer();
        }
        // Handle streaming responses
        if (response.body) {
            return response.body;
        }
        // Default: return as text
        return await response.text();
    }
    /**
     * Join URL paths correctly
     */
    joinPaths(...parts) {
        return parts
            .map((part, index) => {
            if (index === 0) {
                return part.replace(/\/$/, '');
            }
            return part.replace(/^\//, '').replace(/\/$/, '');
        })
            .filter(part => part.length > 0)
            .join('/');
    }
    /**
     * Delay helper for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
