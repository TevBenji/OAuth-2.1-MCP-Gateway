/**
 * MCP Proxy Service
 *
 * Handles request forwarding to upstream MCP servers with tenant context injection,
 * error handling, retry logic, and performance monitoring.
 */

import {
  MCPProxyRequest,
  MCPProxyResponse,
  MCPRequestContext,
  MCPError,
  MCPServerRegistryEntry,
} from '../../types/mcp';
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
  /**
   * Opt-in gateway->upstream context authentication: shared secrets keyed by
   * server_id or resource_identifier. When an upstream has a secret, its
   * requests carry X-Gateway-Ts and X-Gateway-Signature (see
   * docs/security/upstream-verification.md). No secret -> headers absent.
   */
  upstreamSecrets?: Record<string, string>;
}

/** ProxyConfig with every per-request knob resolved (secrets stay separate). */
type ResolvedProxyConfig = Required<Omit<ProxyConfig, 'upstreamSecrets'>>;

/**
 * Compute the upstream context signature: hex HMAC-SHA256 over the exact
 * string `tenant|user|client|scopes|ts` (scopes space-joined). Exported so
 * tests can pin the format — upstream verifiers depend on it byte-for-byte.
 */
export async function signGatewayContext(
  secret: string,
  context: Pick<MCPRequestContext, 'tenant_id' | 'user_id' | 'client_id' | 'scopes'>,
  ts: number
): Promise<string> {
  const payload = [
    context.tenant_id,
    context.user_id,
    context.client_id,
    context.scopes.join(' '),
    String(ts),
  ].join('|');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * MCP Proxy Service
 */
export class MCPProxyService {
  private registry: MCPServerRegistry;
  private defaultConfig: ResolvedProxyConfig;
  private upstreamSecrets: Record<string, string>;

  constructor(registry: MCPServerRegistry, config?: ProxyConfig) {
    this.registry = registry;
    this.upstreamSecrets = config?.upstreamSecrets ?? {};
    this.defaultConfig = {
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      timeout: config?.timeout ?? 30000,
      addTenantHeaders: config?.addTenantHeaders ?? true,
      // SECURITY DEFAULT: the gateway terminates auth. Upstream servers should
      // not receive the client's bearer token unless explicitly opted in, or it
      // leaks into upstream logs/APM and widens replay surface.
      addAuthHeaders: config?.addAuthHeaders ?? false,
      preserveHostHeader: config?.preserveHostHeader ?? false,
    };
  }

  /**
   * Forward request to upstream MCP server with tenant context
   */
  async forwardRequest(
    serverId: string,
    request: MCPProxyRequest,
    config?: ProxyConfig
  ): Promise<MCPProxyResponse> {
    const proxyConfig = { ...this.defaultConfig, ...config };
    const context = request.context;

    // Validate server is accessible
    const server = await this.registry.validateServerForRequest(
      serverId,
      context.tenant_id,
      context.scopes
    );

    // Record access for metrics
    await this.registry.recordAccess(serverId, context.tenant_id);

    // Build target URL
    const targetUrl = this.buildTargetUrl(server, request.url);

    // Build request headers with tenant context
    const headers = this.buildRequestHeaders(request, context, proxyConfig);

    // Opt-in upstream context authentication: sign the injected identity so
    // the upstream can verify it came from the gateway. Secrets and
    // signatures are never logged.
    const secret =
      this.upstreamSecrets[server.server_id] ??
      this.upstreamSecrets[server.config.resource_identifier];
    if (secret) {
      const ts = Math.floor(Date.now() / 1000);
      headers['X-Gateway-Ts'] = String(ts);
      headers['X-Gateway-Signature'] = `v1=${await signGatewayContext(secret, context, ts)}`;
    }

    // Perform request with retry logic
    return this.performRequestWithRetry(
      targetUrl,
      request.method,
      headers,
      request.body,
      server,
      proxyConfig
    );
  }

  /**
   * Forward request by resource identifier (RFC 8707)
   */
  async forwardRequestByResource(
    resourceIdentifier: string,
    request: MCPProxyRequest,
    config?: ProxyConfig
  ): Promise<MCPProxyResponse> {
    const context = request.context;

    // Find server by resource identifier
    const server = await this.registry.getServerByResource(resourceIdentifier, context.tenant_id);

    // Use the server ID to forward the request
    return this.forwardRequest(server.server_id, request, config);
  }

  /**
   * Build target URL for upstream server
   */
  private buildTargetUrl(server: MCPServerRegistryEntry, requestPath: string): string {
    const baseUrl = server.config.endpoint_url;
    const url = new URL(baseUrl);

    // Extract path from request URL if it's a full URL
    let path = requestPath;
    try {
      const requestUrl = new URL(requestPath);
      path = requestUrl.pathname + requestUrl.search;
    } catch {
      // Not a full URL, use as-is
    }

    // Combine base URL with request path
    url.pathname = this.joinPaths(url.pathname, path);

    return url.toString();
  }

  /**
   * Build request headers with tenant context injection
   */
  private buildRequestHeaders(
    request: MCPProxyRequest,
    context: MCPRequestContext,
    config: ResolvedProxyConfig
  ): Record<string, string> {
    const headers: Record<string, string> = { ...request.headers };

    // SECURITY: strip any inbound identity headers before injecting our own.
    // The gateway re-derives these from the verified token context; a client
    // must never be able to smuggle them through to an upstream. The gateway
    // signature headers are stripped for the same reason.
    for (const h of Object.keys(headers)) {
      const lower = h.toLowerCase();
      if (lower === 'x-tenant-id' || lower === 'x-user-id' || lower === 'x-client-id' ||
          lower === 'x-session-id' || lower === 'x-device-id' || lower === 'x-oauth-scopes' ||
          lower === 'x-gateway-ts' || lower === 'x-gateway-signature') {
        delete headers[h];
      }
    }

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
  private async performRequestWithRetry(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string | ArrayBuffer | ReadableStream | undefined,
    server: MCPServerRegistryEntry,
    config: ResolvedProxyConfig
  ): Promise<MCPProxyResponse> {
    const maxRetries = Math.min(config.maxRetries, server.config.retry_attempts);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          server.config.timeout_ms || config.timeout
        );

        // Perform request
        const response = await fetch(url, {
          method,
          headers,
          body: body as BodyInit | undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;

        // Build response
        const proxyResponse: MCPProxyResponse = {
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
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // If this was the last attempt, throw the error
        if (attempt >= maxRetries) {
          throw new MCPError(
            'UPSTREAM_REQUEST_FAILED',
            `Failed to forward request to upstream server after ${maxRetries + 1} attempts: ${lastError.message}`,
            502,
            { server_id: server.server_id, attempts: attempt + 1 }
          );
        }

        // Wait before retrying with exponential backoff
        await this.delay(config.retryDelay * Math.pow(2, attempt));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new MCPError(
      'UPSTREAM_REQUEST_FAILED',
      `Failed to forward request to upstream server: ${lastError?.message || 'Unknown error'}`,
      502,
      { server_id: server.server_id }
    );
  }

  /**
   * Extract response headers
   */
  private extractResponseHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return headers;
  }

  /**
   * Extract response body
   */
  private async extractResponseBody(
    response: Response
  ): Promise<string | ArrayBuffer | ReadableStream | undefined> {
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
  private joinPaths(...parts: string[]): string {
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
