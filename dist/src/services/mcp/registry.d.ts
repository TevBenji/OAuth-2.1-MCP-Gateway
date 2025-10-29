/**
 * MCP Server Registry Service
 *
 * Manages MCP server registration, discovery, and health monitoring.
 * Provides tenant-isolated server registry with configuration management.
 */
import { MCPServerConfig, MCPServerRegistryEntry, MCPServerHealth } from '../../types/mcp';
/**
 * Database interface for MCP server operations
 */
export interface MCPServerDatabase {
    getServerById(serverId: string, tenantId: string): Promise<MCPServerRegistryEntry | null>;
    getServersByTenant(tenantId: string): Promise<MCPServerRegistryEntry[]>;
    getServerByResourceIdentifier(resourceIdentifier: string, tenantId: string): Promise<MCPServerRegistryEntry | null>;
    getAllServers(): Promise<MCPServerRegistryEntry[]>;
    createServer(config: MCPServerConfig): Promise<MCPServerRegistryEntry>;
    updateServer(serverId: string, tenantId: string, config: Partial<MCPServerConfig>): Promise<MCPServerRegistryEntry>;
    updateServerHealth(serverId: string, tenantId: string, health: MCPServerHealth): Promise<void>;
    deleteServer(serverId: string, tenantId: string): Promise<boolean>;
    incrementAccessCount(serverId: string, tenantId: string): Promise<void>;
}
/**
 * MCP Server Registry Service
 */
export declare class MCPServerRegistry {
    private db;
    private healthCheckInterval;
    private healthCheckEnabled;
    constructor(db: MCPServerDatabase, healthCheckInterval?: number, // 1 minute default
    healthCheckEnabled?: boolean);
    /**
     * Register a new MCP server
     */
    registerServer(config: MCPServerConfig): Promise<MCPServerRegistryEntry>;
    /**
     * Get server by ID with tenant isolation
     */
    getServer(serverId: string, tenantId: string): Promise<MCPServerRegistryEntry>;
    /**
     * Get server by resource identifier (RFC 8707)
     */
    getServerByResource(resourceIdentifier: string, tenantId: string): Promise<MCPServerRegistryEntry>;
    /**
     * List all servers for a tenant
     */
    listServers(tenantId: string): Promise<MCPServerRegistryEntry[]>;
    /**
     * Get all servers (administrative function)
     */
    getAllServers(): Promise<MCPServerRegistryEntry[]>;
    /**
     * Update server configuration
     */
    updateServer(serverId: string, tenantId: string, updates: Partial<MCPServerConfig>): Promise<MCPServerRegistryEntry>;
    /**
     * Delete server
     */
    deleteServer(serverId: string, tenantId: string): Promise<boolean>;
    /**
     * Perform health check on a server
     */
    performHealthCheck(serverId: string, tenantId: string): Promise<MCPServerHealth>;
    /**
     * Check if a server is healthy
     */
    isServerHealthy(serverId: string, tenantId: string): Promise<boolean>;
    /**
     * Validate server is accessible for request proxying
     */
    validateServerForRequest(serverId: string, tenantId: string, requiredScopes: string[]): Promise<MCPServerRegistryEntry>;
    /**
     * Record server access for metrics
     */
    recordAccess(serverId: string, tenantId: string): Promise<void>;
}
