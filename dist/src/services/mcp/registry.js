/**
 * MCP Server Registry Service
 *
 * Manages MCP server registration, discovery, and health monitoring.
 * Provides tenant-isolated server registry with configuration management.
 */
import { MCPServerNotFoundError, MCPServerUnhealthyError, } from '../../types/mcp';
/**
 * MCP Server Registry Service
 */
export class MCPServerRegistry {
    db;
    healthCheckInterval;
    healthCheckEnabled;
    constructor(db, healthCheckInterval = 60000, // 1 minute default
    healthCheckEnabled = true) {
        this.db = db;
        this.healthCheckInterval = healthCheckInterval;
        this.healthCheckEnabled = healthCheckEnabled;
    }
    /**
     * Register a new MCP server
     */
    async registerServer(config) {
        // Validate configuration
        if (!config.tenant_id) {
            throw new Error('tenant_id is required for server registration');
        }
        if (!config.name) {
            throw new Error('name is required for server registration');
        }
        if (!config.endpoint_url) {
            throw new Error('endpoint_url is required for server registration');
        }
        if (!config.resource_identifier) {
            throw new Error('resource_identifier is required for server registration');
        }
        // Check if a server with the same resource_identifier already exists for this tenant
        const existing = await this.db.getServerByResourceIdentifier(config.resource_identifier, config.tenant_id);
        if (existing) {
            throw new Error(`Server with resource_identifier '${config.resource_identifier}' already exists for tenant ${config.tenant_id}`);
        }
        // Create server entry
        const entry = await this.db.createServer(config);
        // Perform initial health check if enabled
        if (this.healthCheckEnabled && config.health_check_url) {
            await this.performHealthCheck(entry.server_id, config.tenant_id);
        }
        return entry;
    }
    /**
     * Get server by ID with tenant isolation
     */
    async getServer(serverId, tenantId) {
        const server = await this.db.getServerById(serverId, tenantId);
        if (!server) {
            throw new MCPServerNotFoundError(serverId);
        }
        return server;
    }
    /**
     * Get server by resource identifier (RFC 8707)
     */
    async getServerByResource(resourceIdentifier, tenantId) {
        const server = await this.db.getServerByResourceIdentifier(resourceIdentifier, tenantId);
        if (!server) {
            throw new MCPServerNotFoundError(`resource:${resourceIdentifier}`);
        }
        return server;
    }
    /**
     * List all servers for a tenant
     */
    async listServers(tenantId) {
        return this.db.getServersByTenant(tenantId);
    }
    /**
     * Update server configuration
     */
    async updateServer(serverId, tenantId, updates) {
        const server = await this.getServer(serverId, tenantId);
        // Validate that we're not changing immutable fields
        if (updates.server_id && updates.server_id !== serverId) {
            throw new Error('Cannot change server_id');
        }
        if (updates.tenant_id && updates.tenant_id !== tenantId) {
            throw new Error('Cannot change tenant_id');
        }
        return this.db.updateServer(serverId, tenantId, updates);
    }
    /**
     * Delete server
     */
    async deleteServer(serverId, tenantId) {
        return this.db.deleteServer(serverId, tenantId);
    }
    /**
     * Perform health check on a server
     */
    async performHealthCheck(serverId, tenantId) {
        const server = await this.getServer(serverId, tenantId);
        if (!server.config.health_check_url) {
            // No health check URL configured, assume healthy
            return {
                server_id: serverId,
                status: 'unknown',
                last_check: new Date(),
                consecutive_failures: 0,
            };
        }
        const startTime = Date.now();
        let health;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), server.config.timeout_ms);
            const response = await fetch(server.config.health_check_url, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            if (response.ok) {
                health = {
                    server_id: serverId,
                    status: 'healthy',
                    last_check: new Date(),
                    response_time_ms: responseTime,
                    consecutive_failures: 0,
                };
            }
            else {
                health = {
                    server_id: serverId,
                    status: 'unhealthy',
                    last_check: new Date(),
                    response_time_ms: responseTime,
                    error_message: `Health check returned status ${response.status}`,
                    consecutive_failures: server.health.consecutive_failures + 1,
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            health = {
                server_id: serverId,
                status: 'unhealthy',
                last_check: new Date(),
                response_time_ms: responseTime,
                error_message: error instanceof Error ? error.message : 'Health check failed',
                consecutive_failures: server.health.consecutive_failures + 1,
            };
        }
        // Update health status in database
        await this.db.updateServerHealth(serverId, tenantId, health);
        return health;
    }
    /**
     * Check if a server is healthy
     */
    async isServerHealthy(serverId, tenantId) {
        const server = await this.getServer(serverId, tenantId);
        return server.health.status === 'healthy';
    }
    /**
     * Validate server is accessible for request proxying
     */
    async validateServerForRequest(serverId, tenantId, requiredScopes) {
        const server = await this.getServer(serverId, tenantId);
        // Check if server is active
        if (server.config.status !== 'active') {
            throw new MCPServerNotFoundError(serverId);
        }
        // Check if server is healthy
        if (this.healthCheckEnabled && server.health.status === 'unhealthy') {
            // Allow up to 3 consecutive failures before marking as unhealthy
            if (server.health.consecutive_failures >= 3) {
                throw new MCPServerUnhealthyError(serverId);
            }
        }
        // Validate scopes
        if (server.config.required_scopes && server.config.required_scopes.length > 0) {
            const hasRequiredScopes = server.config.required_scopes.every(reqScope => requiredScopes.some(providedScope => {
                // Support wildcard scopes
                if (providedScope.endsWith(':*')) {
                    const prefix = providedScope.slice(0, -1);
                    return reqScope.startsWith(prefix);
                }
                return providedScope === reqScope;
            }));
            if (!hasRequiredScopes) {
                throw new Error(`Insufficient scope for server ${serverId}. Required: ${server.config.required_scopes.join(', ')}`);
            }
        }
        return server;
    }
    /**
     * Record server access for metrics
     */
    async recordAccess(serverId, tenantId) {
        await this.db.incrementAccessCount(serverId, tenantId);
    }
}
