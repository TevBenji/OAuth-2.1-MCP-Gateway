/**
 * MCP Server Database Queries
 *
 * SQL queries for MCP server registry management with tenant isolation.
 */

import { Database } from '../connection';
import {
  MCPServerConfig,
  MCPServerRegistryEntry,
  MCPServerHealth,
} from '../../types/mcp';
import { v4 as uuidv4 } from 'uuid';
import { MCPServerDatabase } from '../../services/mcp/registry';

/**
 * MCP Server Database Implementation
 */
export class MCPServerQueries implements MCPServerDatabase {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Get MCP server by ID with tenant isolation
   */
  async getServerById(serverId: string, tenantId: string): Promise<MCPServerRegistryEntry | null> {
    const query = `
      SELECT
        server_id,
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        required_scopes,
        health_check_url,
        timeout_ms,
        retry_attempts,
        status,
        metadata,
        health_status,
        health_last_check,
        health_response_time_ms,
        health_error_message,
        health_consecutive_failures,
        created_at,
        updated_at,
        last_accessed,
        access_count
      FROM mcp_servers
      WHERE server_id = ? AND tenant_id = ?
    `;

    const result = await this.db.query(query, [serverId, tenantId]);

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapRowToEntry(result[0]);
  }

  /**
   * Get all servers for a tenant
   */
  async getServersByTenant(tenantId: string): Promise<MCPServerRegistryEntry[]> {
    const query = `
      SELECT
        server_id,
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        required_scopes,
        health_check_url,
        timeout_ms,
        retry_attempts,
        status,
        metadata,
        health_status,
        health_last_check,
        health_response_time_ms,
        health_error_message,
        health_consecutive_failures,
        created_at,
        updated_at,
        last_accessed,
        access_count
      FROM mcp_servers
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `;

    const results = await this.db.query(query, [tenantId]);

    return results.map(row => this.mapRowToEntry(row));
  }

  /**
   * Get server by resource identifier (RFC 8707)
   */
  async getServerByResourceIdentifier(
    resourceIdentifier: string,
    tenantId: string
  ): Promise<MCPServerRegistryEntry | null> {
    const query = `
      SELECT
        server_id,
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        required_scopes,
        health_check_url,
        timeout_ms,
        retry_attempts,
        status,
        metadata,
        health_status,
        health_last_check,
        health_response_time_ms,
        health_error_message,
        health_consecutive_failures,
        created_at,
        updated_at,
        last_accessed,
        access_count
      FROM mcp_servers
      WHERE resource_identifier = ? AND tenant_id = ?
    `;

    const result = await this.db.query(query, [resourceIdentifier, tenantId]);

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapRowToEntry(result[0]);
  }

  /**
   * Create new MCP server
   */
  async createServer(config: MCPServerConfig): Promise<MCPServerRegistryEntry> {
    const serverId = config.server_id || uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO mcp_servers (
        server_id,
        tenant_id,
        name,
        endpoint_url,
        resource_identifier,
        required_scopes,
        health_check_url,
        timeout_ms,
        retry_attempts,
        status,
        metadata,
        health_status,
        health_last_check,
        health_consecutive_failures,
        created_at,
        updated_at,
        last_accessed,
        access_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      serverId,
      config.tenant_id,
      config.name,
      config.endpoint_url,
      config.resource_identifier,
      JSON.stringify(config.required_scopes || []),
      config.health_check_url || null,
      config.timeout_ms || 30000,
      config.retry_attempts || 3,
      config.status || 'active',
      JSON.stringify(config.metadata || {}),
      'unknown',
      now,
      0,
      now,
      now,
      now,
      0,
    ]);

    const entry = await this.getServerById(serverId, config.tenant_id);
    if (!entry) {
      throw new Error('Failed to create MCP server');
    }

    return entry;
  }

  /**
   * Update MCP server configuration
   */
  async updateServer(
    serverId: string,
    tenantId: string,
    updates: Partial<MCPServerConfig>
  ): Promise<MCPServerRegistryEntry> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.endpoint_url !== undefined) {
      fields.push('endpoint_url = ?');
      values.push(updates.endpoint_url);
    }

    if (updates.resource_identifier !== undefined) {
      fields.push('resource_identifier = ?');
      values.push(updates.resource_identifier);
    }

    if (updates.required_scopes !== undefined) {
      fields.push('required_scopes = ?');
      values.push(JSON.stringify(updates.required_scopes));
    }

    if (updates.health_check_url !== undefined) {
      fields.push('health_check_url = ?');
      values.push(updates.health_check_url);
    }

    if (updates.timeout_ms !== undefined) {
      fields.push('timeout_ms = ?');
      values.push(updates.timeout_ms);
    }

    if (updates.retry_attempts !== undefined) {
      fields.push('retry_attempts = ?');
      values.push(updates.retry_attempts);
    }

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(serverId, tenantId);

    const query = `
      UPDATE mcp_servers
      SET ${fields.join(', ')}
      WHERE server_id = ? AND tenant_id = ?
    `;

    await this.db.execute(query, values);

    const entry = await this.getServerById(serverId, tenantId);
    if (!entry) {
      throw new Error('Failed to update MCP server');
    }

    return entry;
  }

  /**
   * Update server health status
   */
  async updateServerHealth(serverId: string, tenantId: string, health: MCPServerHealth): Promise<void> {
    const query = `
      UPDATE mcp_servers
      SET
        health_status = ?,
        health_last_check = ?,
        health_response_time_ms = ?,
        health_error_message = ?,
        health_consecutive_failures = ?,
        updated_at = ?
      WHERE server_id = ? AND tenant_id = ?
    `;

    await this.db.execute(query, [
      health.status,
      health.last_check.toISOString(),
      health.response_time_ms || null,
      health.error_message || null,
      health.consecutive_failures,
      new Date().toISOString(),
      serverId,
      tenantId,
    ]);
  }

  /**
   * Delete MCP server
   */
  async deleteServer(serverId: string, tenantId: string): Promise<boolean> {
    const query = `
      DELETE FROM mcp_servers
      WHERE server_id = ? AND tenant_id = ?
    `;

    const result = await this.db.execute(query, [serverId, tenantId]);
    return result.rowsAffected > 0;
  }

  /**
   * Increment server access count
   */
  async incrementAccessCount(serverId: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE mcp_servers
      SET
        access_count = access_count + 1,
        last_accessed = ?
      WHERE server_id = ? AND tenant_id = ?
    `;

    await this.db.execute(query, [new Date().toISOString(), serverId, tenantId]);
  }

  /**
   * Map database row to MCPServerRegistryEntry
   */
  private mapRowToEntry(row: any): MCPServerRegistryEntry {
    const config: MCPServerConfig = {
      server_id: row.server_id,
      tenant_id: row.tenant_id,
      name: row.name,
      endpoint_url: row.endpoint_url,
      resource_identifier: row.resource_identifier,
      required_scopes: JSON.parse(row.required_scopes || '[]'),
      health_check_url: row.health_check_url,
      timeout_ms: row.timeout_ms,
      retry_attempts: row.retry_attempts,
      status: row.status,
      metadata: JSON.parse(row.metadata || '{}'),
    };

    const health: MCPServerHealth = {
      server_id: row.server_id,
      status: row.health_status,
      last_check: new Date(row.health_last_check),
      response_time_ms: row.health_response_time_ms,
      error_message: row.health_error_message,
      consecutive_failures: row.health_consecutive_failures,
    };

    return {
      server_id: row.server_id,
      tenant_id: row.tenant_id,
      config,
      health,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      last_accessed: new Date(row.last_accessed),
      access_count: row.access_count,
    };
  }
}
