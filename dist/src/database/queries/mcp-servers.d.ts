/**
 * MCP Server Database Queries
 *
 * SQL queries for MCP server registry management with tenant isolation.
 */
import { DatabaseManager } from '../connection';
import { MCPServerConfig, MCPServerRegistryEntry, MCPServerHealth } from '../../types/mcp';
import { MCPServerDatabase } from '../../services/mcp/registry';
/**
 * MCP Server Database Implementation
 */
export declare class MCPServerQueries implements MCPServerDatabase {
    private db;
    constructor(db: DatabaseManager);
    /**
     * Get MCP server by ID with tenant isolation
     */
    getServerById(serverId: string, tenantId: string): Promise<MCPServerRegistryEntry | null>;
    /**
     * Get all servers for a tenant
     */
    getServersByTenant(tenantId: string): Promise<MCPServerRegistryEntry[]>;
    /**
     * Get server by resource identifier (RFC 8707)
     */
    getServerByResourceIdentifier(resourceIdentifier: string, tenantId: string): Promise<MCPServerRegistryEntry | null>;
    /**
     * Create new MCP server
     */
    createServer(config: MCPServerConfig): Promise<MCPServerRegistryEntry>;
    /**
     * Update MCP server configuration
     */
    updateServer(serverId: string, tenantId: string, updates: Partial<MCPServerConfig>): Promise<MCPServerRegistryEntry>;
    /**
     * Update server health status
     */
    updateServerHealth(serverId: string, tenantId: string, health: MCPServerHealth): Promise<void>;
    /**
     * Delete MCP server
     */
    deleteServer(serverId: string, tenantId: string): Promise<boolean>;
    /**
     * Increment server access count
     */
    incrementAccessCount(serverId: string, tenantId: string): Promise<void>;
    /**
     * Map database row to MCPServerRegistryEntry
     */
    private mapRowToEntry;
}
