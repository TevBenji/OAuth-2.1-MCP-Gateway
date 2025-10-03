/**
 * Real MCP Server Test Utilities
 *
 * Provides utilities for testing with real MCP server implementations
 * to validate end-to-end OAuth 2.1 flows and request proxying.
 */

import { vi } from 'vitest';

export interface MCPServerConfig {
  port: number;
  serverName: string;
  baseUrl?: string;
  supportedTools?: MCPTool[];
  supportedResources?: MCPResource[];
  requireAuth?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  handler?: (input: any, context: MCPRequestContext) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  handler?: (context: MCPRequestContext) => Promise<any>;
}

export interface MCPRequestContext {
  tenant_id: string;
  user_id: string;
  client_id: string;
  session_id: string;
  scopes: string[];
  headers: Record<string, string>;
}

/**
 * Real MCP Server Mock for Integration Testing
 *
 * Simulates a production MCP server with full protocol support
 */
export class RealMCPServerMock {
  private config: MCPServerConfig;
  private isRunning: boolean = false;
  private requestLog: Array<{
    timestamp: number;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    context?: MCPRequestContext;
  }> = [];
  private responseHandlers: Map<string, (req: any) => Promise<any>> = new Map();

  constructor(config: MCPServerConfig) {
    this.config = {
      port: 3001,
      serverName: 'test-mcp-server',
      requireAuth: true,
      ...config
    };
  }

  /**
   * Start the mock MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('MCP server is already running');
    }

    // Mock fetch globally to intercept requests
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockImplementation(async (url: string | URL, options: any = {}) => {
      const urlObj = typeof url === 'string' ? new URL(url) : url;
      const baseUrl = this.config.baseUrl || `http://localhost:${this.config.port}`;

      // Only intercept requests to this MCP server
      if (!urlObj.href.startsWith(baseUrl)) {
        return originalFetch(url, options);
      }

      const path = urlObj.pathname;
      const method = options.method || 'GET';

      // Log the request
      this.requestLog.push({
        timestamp: Date.now(),
        method,
        path,
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : undefined
      });

      // Handle authentication if required
      if (this.config.requireAuth) {
        const authHeader = options.headers?.['Authorization'] || options.headers?.['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return this.createResponse(401, {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header'
          });
        }
      }

      // Route the request
      return this.routeRequest(method, path, options);
    });

    // Register default handlers
    this.registerDefaultHandlers();

    this.isRunning = true;
    console.log(`✅ Mock MCP Server '${this.config.serverName}' started on port ${this.config.port}`);
  }

  /**
   * Stop the mock MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    vi.restoreAllMocks();
    this.isRunning = false;
    this.requestLog = [];
    this.responseHandlers.clear();

    console.log(`✅ Mock MCP Server '${this.config.serverName}' stopped`);
  }

  /**
   * Register default MCP protocol handlers
   */
  private registerDefaultHandlers(): void {
    // Health check endpoint
    this.setHandler('GET', '/health', async () => ({
      status: 'healthy',
      server: this.config.serverName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));

    // MCP server info endpoint
    this.setHandler('GET', '/mcp/info', async () => ({
      name: this.config.serverName,
      version: '1.0.0',
      protocol_version: '2024-11-05',
      capabilities: {
        tools: !!this.config.supportedTools && this.config.supportedTools.length > 0,
        resources: !!this.config.supportedResources && this.config.supportedResources.length > 0,
        prompts: false
      }
    }));

    // List tools endpoint
    this.setHandler('GET', '/mcp/tools/list', async () => ({
      tools: this.config.supportedTools || []
    }));

    // Call tool endpoint
    this.setHandler('POST', '/mcp/tools/call', async (req) => {
      const { name, arguments: toolArgs } = JSON.parse(req.body || '{}');

      const tool = this.config.supportedTools?.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      if (tool.handler) {
        const context = this.extractContext(req.headers);
        return {
          content: await tool.handler(toolArgs, context),
          isError: false
        };
      }

      return {
        content: { message: `Tool ${name} executed successfully` },
        isError: false
      };
    });

    // List resources endpoint
    this.setHandler('GET', '/mcp/resources/list', async () => ({
      resources: this.config.supportedResources || []
    }));

    // Read resource endpoint
    this.setHandler('POST', '/mcp/resources/read', async (req) => {
      const { uri } = JSON.parse(req.body || '{}');

      const resource = this.config.supportedResources?.find(r => r.uri === uri);
      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      if (resource.handler) {
        const context = this.extractContext(req.headers);
        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType || 'text/plain',
              text: await resource.handler(context)
            }
          ]
        };
      }

      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text: `Resource content for ${uri}`
          }
        ]
      };
    });
  }

  /**
   * Route incoming request to appropriate handler
   */
  private async routeRequest(method: string, path: string, options: any): Promise<Response> {
    const handlerKey = `${method}:${path}`;
    const handler = this.responseHandlers.get(handlerKey);

    if (handler) {
      try {
        const result = await handler(options);
        return this.createResponse(200, result);
      } catch (error: any) {
        return this.createResponse(500, {
          error: 'internal_server_error',
          error_description: error.message
        });
      }
    }

    // Try pattern matching for dynamic paths
    for (const [key, handler] of this.responseHandlers.entries()) {
      const [handlerMethod, handlerPath] = key.split(':');
      if (handlerMethod === method && this.matchPath(path, handlerPath)) {
        try {
          const result = await handler(options);
          return this.createResponse(200, result);
        } catch (error: any) {
          return this.createResponse(500, {
            error: 'internal_server_error',
            error_description: error.message
          });
        }
      }
    }

    return this.createResponse(404, {
      error: 'not_found',
      error_description: `Endpoint not found: ${method} ${path}`
    });
  }

  /**
   * Match request path against handler path pattern
   */
  private matchPath(requestPath: string, handlerPath: string): boolean {
    // Simple pattern matching - can be enhanced for wildcards
    const requestParts = requestPath.split('/').filter(p => p);
    const handlerParts = handlerPath.split('/').filter(p => p);

    if (requestParts.length !== handlerParts.length) {
      return false;
    }

    return handlerParts.every((part, index) => {
      return part.startsWith(':') || part === requestParts[index];
    });
  }

  /**
   * Create HTTP response
   */
  private createResponse(status: number, data: any): Response {
    return new Response(JSON.stringify(data), {
      status,
      statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Internal Server Error',
      headers: new Headers({
        'content-type': 'application/json',
        'x-mcp-server': this.config.serverName
      })
    });
  }

  /**
   * Extract MCP request context from headers
   */
  private extractContext(headers: Record<string, string>): MCPRequestContext {
    return {
      tenant_id: headers['X-Tenant-ID'] || headers['x-tenant-id'] || 'unknown',
      user_id: headers['X-User-ID'] || headers['x-user-id'] || 'unknown',
      client_id: headers['X-Client-ID'] || headers['x-client-id'] || 'unknown',
      session_id: headers['X-Session-ID'] || headers['x-session-id'] || 'unknown',
      scopes: (headers['X-Scopes'] || headers['x-scopes'] || '').split(' ').filter(s => s),
      headers
    };
  }

  /**
   * Register custom request handler
   */
  setHandler(method: string, path: string, handler: (req: any) => Promise<any>): void {
    const key = `${method}:${path}`;
    this.responseHandlers.set(key, handler);
  }

  /**
   * Get request log for testing
   */
  getRequestLog() {
    return [...this.requestLog];
  }

  /**
   * Clear request log
   */
  clearRequestLog(): void {
    this.requestLog = [];
  }

  /**
   * Get last request
   */
  getLastRequest() {
    return this.requestLog[this.requestLog.length - 1];
  }

  /**
   * Get requests by path
   */
  getRequestsByPath(path: string) {
    return this.requestLog.filter(req => req.path === path);
  }

  /**
   * Assert request was made
   */
  assertRequestMade(method: string, path: string): boolean {
    return this.requestLog.some(req => req.method === method && req.path === path);
  }
}

/**
 * Create a test MCP server with common tools
 */
export function createTestMCPServer(config?: Partial<MCPServerConfig>): RealMCPServerMock {
  const defaultTools: MCPTool[] = [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name or coordinates' }
        },
        required: ['location']
      },
      handler: async (input, context) => ({
        location: input.location,
        temperature: 22,
        condition: 'sunny',
        humidity: 65,
        tenant_id: context.tenant_id
      })
    },
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression to evaluate' }
        },
        required: ['expression']
      },
      handler: async (input) => ({
        expression: input.expression,
        result: eval(input.expression) // Note: In production, use safe math parser
      })
    }
  ];

  const defaultResources: MCPResource[] = [
    {
      uri: 'file:///data/sample.txt',
      name: 'Sample Data',
      description: 'Sample text data resource',
      mimeType: 'text/plain',
      handler: async (context) => `Sample data for tenant: ${context.tenant_id}`
    }
  ];

  return new RealMCPServerMock({
    port: 3001,
    serverName: 'test-mcp-server',
    supportedTools: defaultTools,
    supportedResources: defaultResources,
    requireAuth: true,
    ...config
  });
}
