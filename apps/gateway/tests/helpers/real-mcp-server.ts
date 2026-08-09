/**
 * Real MCP Server Test Utilities
 *
 * Spins up a real local Node HTTP server that speaks a minimal MCP-style
 * protocol, so tests exercise genuine network I/O through the gateway proxy.
 */

import http from 'node:http';
import type { AddressInfo } from 'node:net';

export interface MCPServerConfig {
  port?: number;
  serverName?: string;
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

interface LoggedRequest {
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
}

interface HandlerRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Real MCP server for integration testing: a plain Node http.Server with a
 * minimal MCP-flavoured routing table and a request log for assertions.
 */
export class RealMCPServerMock {
  private config: Required<Pick<MCPServerConfig, 'port' | 'serverName' | 'requireAuth'>> &
    MCPServerConfig;
  private server?: http.Server;
  private requestLog: LoggedRequest[] = [];
  private responseHandlers: Map<string, (req: HandlerRequest) => Promise<any>> = new Map();

  constructor(config: MCPServerConfig = {}) {
    this.config = {
      port: 3001,
      serverName: 'test-mcp-server',
      requireAuth: true,
      ...config,
    };
  }

  /** The port the server is actually listening on. */
  get port(): number {
    if (!this.server) return this.config.port;
    return (this.server.address() as AddressInfo).port;
  }

  get baseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  async start(): Promise<void> {
    if (this.server) {
      throw new Error('MCP server is already running');
    }

    this.registerDefaultHandlers();

    this.server = http.createServer((req, res) => {
      void this.handleHttpRequest(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.config.port, '127.0.0.1', () => resolve());
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;

    await new Promise<void>((resolve, reject) => {
      this.server!.close(err => (err ? reject(err) : resolve()));
    });
    this.server = undefined;
    this.requestLog = [];
    this.responseHandlers.clear();
  }

  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const bodyText = Buffer.concat(chunks).toString('utf8') || undefined;

    const url = new URL(req.url ?? '/', this.baseUrl);
    const path = url.pathname;
    const method = req.method ?? 'GET';
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key] = Array.isArray(value) ? value.join(', ') : (value ?? '');
    }

    // Log the request
    let parsedBody: any;
    try {
      parsedBody = bodyText ? JSON.parse(bodyText) : undefined;
    } catch {
      parsedBody = bodyText;
    }
    this.requestLog.push({ timestamp: Date.now(), method, path, headers, body: parsedBody });

    // Handle authentication if required (health endpoint stays public).
    // Two accepted signals: a bearer token, for callers hitting this server
    // directly, or the gateway's injected identity context. The gateway
    // terminates auth and no longer forwards client bearer tokens upstream,
    // so a proxied request arrives with context headers and no Authorization
    // (docs/security/hardening-notes.md §2, option (a): upstream reachable
    // only by the gateway).
    if (this.config.requireAuth && path !== '/health') {
      const authHeader = headers['authorization'];
      const hasBearer = !!authHeader && authHeader.startsWith('Bearer ');
      const hasGatewayContext = !!headers['x-tenant-id'] && !!headers['x-user-id'];
      if (!hasBearer && !hasGatewayContext) {
        return this.send(res, 401, {
          error: 'unauthorized',
          error_description: 'Missing or invalid authorization header',
        });
      }
    }

    const handlerReq: HandlerRequest = { method, path, headers, body: bodyText };

    // Exact match, then pattern match
    const handler =
      this.responseHandlers.get(`${method}:${path}`) ?? this.findPatternHandler(method, path);

    if (!handler) {
      return this.send(res, 404, {
        error: 'not_found',
        error_description: `Endpoint not found: ${method} ${path}`,
      });
    }

    try {
      const result = await handler(handlerReq);
      return this.send(res, 200, result);
    } catch (error: any) {
      return this.send(res, 500, {
        error: 'internal_server_error',
        error_description: error.message,
      });
    }
  }

  private findPatternHandler(method: string, path: string) {
    for (const [key, handler] of this.responseHandlers.entries()) {
      const sep = key.indexOf(':');
      const handlerMethod = key.slice(0, sep);
      const handlerPath = key.slice(sep + 1);
      if (handlerMethod === method && this.matchPath(path, handlerPath)) {
        return handler;
      }
    }
    return undefined;
  }

  private matchPath(requestPath: string, handlerPath: string): boolean {
    const requestParts = requestPath.split('/').filter(p => p);
    const handlerParts = handlerPath.split('/').filter(p => p);

    if (requestParts.length !== handlerParts.length) {
      return false;
    }

    return handlerParts.every((part, index) => part.startsWith(':') || part === requestParts[index]);
  }

  private send(res: http.ServerResponse, status: number, data: any): void {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.setHeader('x-mcp-server', this.config.serverName);
    res.end(JSON.stringify(data));
  }

  /** Register default MCP protocol handlers */
  private registerDefaultHandlers(): void {
    this.setHandler('GET', '/health', async () => ({
      status: 'healthy',
      server: this.config.serverName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));

    this.setHandler('GET', '/mcp/info', async () => ({
      name: this.config.serverName,
      version: '1.0.0',
      protocol_version: '2024-11-05',
      capabilities: {
        tools: !!this.config.supportedTools && this.config.supportedTools.length > 0,
        resources: !!this.config.supportedResources && this.config.supportedResources.length > 0,
        prompts: false,
      },
    }));

    this.setHandler('GET', '/mcp/tools/list', async () => ({
      tools: (this.config.supportedTools || []).map(({ handler, ...tool }) => tool),
    }));

    this.setHandler('POST', '/mcp/tools/call', async req => {
      const { name, arguments: toolArgs } = JSON.parse(req.body || '{}');

      const tool = this.config.supportedTools?.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      if (tool.handler) {
        const context = this.extractContext(req.headers);
        return {
          content: await tool.handler(toolArgs, context),
          isError: false,
        };
      }

      return {
        content: { message: `Tool ${name} executed successfully` },
        isError: false,
      };
    });

    this.setHandler('GET', '/mcp/resources/list', async () => ({
      resources: (this.config.supportedResources || []).map(({ handler, ...resource }) => resource),
    }));

    this.setHandler('POST', '/mcp/resources/read', async req => {
      const { uri } = JSON.parse(req.body || '{}');

      const resource = this.config.supportedResources?.find(r => r.uri === uri);
      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      const text = resource.handler
        ? await resource.handler(this.extractContext(req.headers))
        : `Resource content for ${uri}`;

      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text,
          },
        ],
      };
    });
  }

  /** Extract MCP request context from (lowercased http) headers */
  private extractContext(headers: Record<string, string>): MCPRequestContext {
    return {
      tenant_id: headers['x-tenant-id'] || 'unknown',
      user_id: headers['x-user-id'] || 'unknown',
      client_id: headers['x-client-id'] || 'unknown',
      session_id: headers['x-session-id'] || 'unknown',
      scopes: (headers['x-oauth-scopes'] || headers['x-scopes'] || '').split(' ').filter(s => s),
      headers,
    };
  }

  /** Register custom request handler */
  setHandler(method: string, path: string, handler: (req: HandlerRequest) => Promise<any>): void {
    this.responseHandlers.set(`${method}:${path}`, handler);
  }

  getRequestLog(): LoggedRequest[] {
    return [...this.requestLog];
  }

  clearRequestLog(): void {
    this.requestLog = [];
  }

  getLastRequest(): LoggedRequest | undefined {
    return this.requestLog[this.requestLog.length - 1];
  }

  getRequestsByPath(path: string): LoggedRequest[] {
    return this.requestLog.filter(req => req.path === path);
  }

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
          location: { type: 'string', description: 'City name or coordinates' },
        },
        required: ['location'],
      },
      handler: async (input, context) => ({
        location: input.location,
        temperature: 22,
        condition: 'sunny',
        humidity: 65,
        tenant_id: context.tenant_id,
      }),
    },
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression to evaluate' },
        },
        required: ['expression'],
      },
      handler: async input => ({
        expression: input.expression,
        // ponytail: eval is fine for test fixtures with hard-coded expressions
        result: eval(input.expression),
      }),
    },
  ];

  const defaultResources: MCPResource[] = [
    {
      uri: 'file:///data/sample.txt',
      name: 'Sample Data',
      description: 'Sample text data resource',
      mimeType: 'text/plain',
      handler: async context => `Sample data for tenant: ${context.tenant_id}`,
    },
  ];

  return new RealMCPServerMock({
    serverName: 'test-mcp-server',
    supportedTools: defaultTools,
    supportedResources: defaultResources,
    requireAuth: true,
    ...config,
  });
}
