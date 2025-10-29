/**
 * MCP Proxy Request Handler
 *
 * HTTP handlers for proxying requests to upstream MCP servers.
 * Supports both server ID and resource identifier routing.
 */

import { Context } from 'hono';
import { MCPProxyService } from '../../services/mcp/proxy';
import { MCPRequestContext, MCPProxyRequest, MCPError } from '../../types/mcp';

/**
 * Handler for proxying requests to MCP servers by server ID
 * Route: /mcp/:serverId/*
 */
export async function proxyToMCPServer(c: Context) {
  try {
    // Get MCP context from auth middleware
    const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

    if (!mcpContext) {
      throw new MCPError(
        'MISSING_CONTEXT',
        'Request context not found. Ensure authMiddleware is applied.',
        500
      );
    }

    // Get server ID from route params
    const serverId = c.req.param('serverId');

    if (!serverId) {
      throw new MCPError('MISSING_SERVER_ID', 'Server ID is required', 400);
    }

    // Get proxy service from context
    const proxyService = c.get('proxyService') as MCPProxyService | undefined;

    if (!proxyService) {
      throw new MCPError('PROXY_SERVICE_NOT_CONFIGURED', 'Proxy service not configured', 500);
    }

    // Extract the path after /mcp/:serverId/
    const fullPath = c.req.path;
    const pathPrefix = `/mcp/${serverId}`;
    const targetPath = fullPath.substring(pathPrefix.length) || '/';

    // Build proxy request
    const proxyRequest: MCPProxyRequest = {
      method: c.req.method,
      url: targetPath + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : ''),
      headers: extractRequestHeaders(c),
      body: await extractRequestBody(c),
      context: mcpContext,
    };

    // Forward request to upstream server
    const proxyResponse = await proxyService.forwardRequest(serverId, proxyRequest);

    // Set response headers
    Object.entries(proxyResponse.headers).forEach(([key, value]) => {
      c.header(key, value);
    });

    // Add performance header
    c.header('X-Gateway-Latency-Ms', proxyResponse.latency_ms.toString());

    // Return response based on body type
    if (proxyResponse.body instanceof ArrayBuffer) {
      // Set headers manually before returning the body
      Object.entries({
        ...proxyResponse.headers,
        'Content-Type': proxyResponse.headers['content-type'] || 'application/octet-stream'
      }).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(proxyResponse.body, proxyResponse.status);
    } else if (typeof proxyResponse.body === 'string') {
      // Try to parse as JSON for proper response handling, otherwise return as text
      try {
        const parsedBody = JSON.parse(proxyResponse.body);
        return c.json(parsedBody, proxyResponse.status);
      } catch {
        // If not valid JSON, set headers and return as text
        Object.entries({
          ...proxyResponse.headers,
          'Content-Type': proxyResponse.headers['content-type'] || 'text/plain'
        }).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.body(proxyResponse.body, proxyResponse.status);
      }
    } else if (proxyResponse.body) {
      // For other body types (like ReadableStream), set headers and return the body
      Object.entries({
        ...proxyResponse.headers,
        'Content-Type': proxyResponse.headers['content-type'] || 'application/octet-stream'
      }).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(proxyResponse.body, proxyResponse.status);
    } else {
      // No body - set headers and return null body
      Object.entries(proxyResponse.headers).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(null, proxyResponse.status);
    }
  } catch (error) {
    return handleProxyError(c, error);
  }
}

/**
 * Handler for proxying requests to MCP servers by resource identifier (RFC 8707)
 * Route: /mcp/resource/*
 */
export async function proxyByResourceIdentifier(c: Context) {
  try {
    // Get MCP context from auth middleware
    const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

    if (!mcpContext) {
      throw new MCPError(
        'MISSING_CONTEXT',
        'Request context not found. Ensure authMiddleware is applied.',
        500
      );
    }

    // Get resource identifier from query parameter or header
    const resourceIdentifier = c.req.query('resource') || c.req.header('X-Resource-Identifier');

    if (!resourceIdentifier) {
      throw new MCPError(
        'MISSING_RESOURCE_IDENTIFIER',
        'Resource identifier is required (via ?resource= query parameter or X-Resource-Identifier header)',
        400
      );
    }

    // Get proxy service from context
    const proxyService = c.get('proxyService') as MCPProxyService | undefined;

    if (!proxyService) {
      throw new MCPError('PROXY_SERVICE_NOT_CONFIGURED', 'Proxy service not configured', 500);
    }

    // Extract the path after /mcp/resource/
    const fullPath = c.req.path;
    const pathPrefix = '/mcp/resource';
    const targetPath = fullPath.substring(pathPrefix.length) || '/';

    // Build proxy request
    const proxyRequest: MCPProxyRequest = {
      method: c.req.method,
      url: targetPath + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : ''),
      headers: extractRequestHeaders(c),
      body: await extractRequestBody(c),
      context: mcpContext,
    };

    // Forward request to upstream server by resource identifier
    const proxyResponse = await proxyService.forwardRequestByResource(
      resourceIdentifier,
      proxyRequest
    );

    // Set response headers
    Object.entries(proxyResponse.headers).forEach(([key, value]) => {
      c.header(key, value);
    });

    // Add performance header
    c.header('X-Gateway-Latency-Ms', proxyResponse.latency_ms.toString());

    // Return response based on body type
    if (proxyResponse.body instanceof ArrayBuffer) {
      // Set headers manually before returning the body
      Object.entries({
        ...proxyResponse.headers,
        'Content-Type': proxyResponse.headers['content-type'] || 'application/octet-stream'
      }).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(proxyResponse.body, proxyResponse.status);
    } else if (typeof proxyResponse.body === 'string') {
      // Try to parse as JSON for proper response handling, otherwise return as text
      try {
        const parsedBody = JSON.parse(proxyResponse.body);
        return c.json(parsedBody, proxyResponse.status);
      } catch {
        // If not valid JSON, set headers and return as text
        Object.entries({
          ...proxyResponse.headers,
          'Content-Type': proxyResponse.headers['content-type'] || 'text/plain'
        }).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.body(proxyResponse.body, proxyResponse.status);
      }
    } else if (proxyResponse.body) {
      // For other body types (like ReadableStream), set headers and return the body
      Object.entries({
        ...proxyResponse.headers,
        'Content-Type': proxyResponse.headers['content-type'] || 'application/octet-stream'
      }).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(proxyResponse.body, proxyResponse.status);
    } else {
      // No body - set headers and return null body
      Object.entries(proxyResponse.headers).forEach(([key, value]) => {
        c.header(key, value);
      });
      return c.body(null, proxyResponse.status);
    }
  } catch (error) {
    return handleProxyError(c, error);
  }
}

/**
 * Extract request headers, filtering out sensitive headers
 */
function extractRequestHeaders(c: Context): Record<string, string> {
  const headers: Record<string, string> = {};

  // Headers to exclude from forwarding
  const excludedHeaders = new Set([
    'host',
    'connection',
    'keep-alive',
    'transfer-encoding',
    'upgrade',
    'cf-connecting-ip',
    'cf-ray',
    'cf-visitor',
  ]);

  // Copy headers
  c.req.raw.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!excludedHeaders.has(lowerKey)) {
      headers[key] = value;
    }
  });

  return headers;
}

/**
 * Extract request body
 */
async function extractRequestBody(
  c: Context
): Promise<string | ArrayBuffer | ReadableStream | undefined> {
  const contentType = c.req.header('content-type') || '';

  // No body for GET, HEAD, DELETE requests
  if (['GET', 'HEAD', 'DELETE'].includes(c.req.method)) {
    return undefined;
  }

  try {
    // Handle JSON bodies
    if (contentType.includes('application/json')) {
      const json = await c.req.json();
      return JSON.stringify(json);
    }

    // Handle text bodies
    if (contentType.includes('text/')) {
      return await c.req.text();
    }

    // Handle form data
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await c.req.text();
      return text;
    }

    // Handle multipart form data
    if (contentType.includes('multipart/form-data')) {
      return await c.req.arrayBuffer();
    }

    // Handle binary data
    if (contentType.includes('application/octet-stream')) {
      return await c.req.arrayBuffer();
    }

    // Default: try to get raw body
    return c.req.raw.body || undefined;
  } catch (error) {
    console.error('Error extracting request body:', error);
    return undefined;
  }
}

/**
 * Handle proxy errors with appropriate responses
 */
function handleProxyError(c: Context, error: unknown) {
  if (error instanceof MCPError) {
    return c.json(
      {
        error: error.code,
        error_description: error.message,
        details: error.details,
      },
      error.statusCode as 400 | 401 | 403 | 404 | 500 | 502 | 503
    );
  }

  // Log unexpected errors
  console.error('Unexpected proxy error:', error);

  return c.json(
    {
      error: 'PROXY_ERROR',
      error_description: 'An unexpected error occurred while proxying the request',
    },
    500
  );
}