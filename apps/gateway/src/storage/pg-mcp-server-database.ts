/**
 * PostgreSQL implementation of the MCP server registry database.
 *
 * Health status and access counters live in the metadata jsonb column —
 * they are advisory data, not relational.
 */
import { and, eq } from 'drizzle-orm';
import { mcpServers, type Db } from '@oauth-mcp-gateway/db';
import type { MCPServerDatabase } from '../services/mcp/registry';
import type { MCPServerConfig, MCPServerHealth, MCPServerRegistryEntry } from '../types/mcp';

type Row = typeof mcpServers.$inferSelect;

export class PgMcpServerDatabase implements MCPServerDatabase {
  constructor(private db: Db) {}

  async getServerById(serverId: string, tenantId: string): Promise<MCPServerRegistryEntry | null> {
    const [row] = await this.db
      .select()
      .from(mcpServers)
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)))
      .limit(1);
    return row ? this.toEntry(row) : null;
  }

  async getServersByTenant(tenantId: string): Promise<MCPServerRegistryEntry[]> {
    const rows = await this.db.select().from(mcpServers).where(eq(mcpServers.tenantId, tenantId));
    return rows.map(r => this.toEntry(r));
  }

  async getServerByResourceIdentifier(
    resourceIdentifier: string,
    tenantId: string
  ): Promise<MCPServerRegistryEntry | null> {
    const [row] = await this.db
      .select()
      .from(mcpServers)
      .where(
        and(
          eq(mcpServers.resourceIdentifier, resourceIdentifier),
          eq(mcpServers.tenantId, tenantId)
        )
      )
      .limit(1);
    return row ? this.toEntry(row) : null;
  }

  async getAllServers(): Promise<MCPServerRegistryEntry[]> {
    const rows = await this.db.select().from(mcpServers);
    return rows.map(r => this.toEntry(r));
  }

  async createServer(config: MCPServerConfig): Promise<MCPServerRegistryEntry> {
    const [row] = await this.db
      .insert(mcpServers)
      .values({
        ...(config.server_id ? { serverId: config.server_id } : {}),
        tenantId: config.tenant_id,
        name: config.name,
        endpointUrl: config.endpoint_url,
        resourceIdentifier: config.resource_identifier,
        requiredScopes: config.required_scopes ?? [],
        healthCheckUrl: config.health_check_url ?? null,
        status: config.status ?? 'active',
        timeoutMs: config.timeout_ms ?? 30000,
        retryAttempts: config.retry_attempts ?? 3,
        metadata: { custom: config.metadata ?? {} },
      })
      .returning();
    return this.toEntry(row!);
  }

  async updateServer(
    serverId: string,
    tenantId: string,
    config: Partial<MCPServerConfig>
  ): Promise<MCPServerRegistryEntry> {
    const set: Partial<typeof mcpServers.$inferInsert> = {};
    if (config.name !== undefined) set.name = config.name;
    if (config.endpoint_url !== undefined) set.endpointUrl = config.endpoint_url;
    if (config.resource_identifier !== undefined) {
      set.resourceIdentifier = config.resource_identifier;
    }
    if (config.required_scopes !== undefined) set.requiredScopes = config.required_scopes;
    if (config.health_check_url !== undefined) set.healthCheckUrl = config.health_check_url;
    if (config.status !== undefined) set.status = config.status;
    if (config.timeout_ms !== undefined) set.timeoutMs = config.timeout_ms;
    if (config.retry_attempts !== undefined) set.retryAttempts = config.retry_attempts;

    const [row] = await this.db
      .update(mcpServers)
      .set(set)
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)))
      .returning();
    if (!row) throw new Error(`MCP server not found: ${serverId}`);
    return this.toEntry(row);
  }

  async updateServerHealth(
    serverId: string,
    tenantId: string,
    health: MCPServerHealth
  ): Promise<void> {
    await this.mergeMetadata(serverId, tenantId, {
      health: { ...health, last_check: health.last_check.toISOString() },
    });
  }

  async deleteServer(serverId: string, tenantId: string): Promise<boolean> {
    const rows = await this.db
      .delete(mcpServers)
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)))
      .returning({ serverId: mcpServers.serverId });
    return rows.length > 0;
  }

  async incrementAccessCount(serverId: string, tenantId: string): Promise<void> {
    const [row] = await this.db
      .select({ metadata: mcpServers.metadata })
      .from(mcpServers)
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)))
      .limit(1);
    if (!row) return;
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    await this.mergeMetadata(serverId, tenantId, {
      accessCount: ((meta.accessCount as number) ?? 0) + 1,
      lastAccessed: new Date().toISOString(),
    });
  }

  private async mergeMetadata(
    serverId: string,
    tenantId: string,
    patch: Record<string, unknown>
  ): Promise<void> {
    const [row] = await this.db
      .select({ metadata: mcpServers.metadata })
      .from(mcpServers)
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)))
      .limit(1);
    if (!row) return;
    await this.db
      .update(mcpServers)
      .set({ metadata: { ...(row.metadata ?? {}), ...patch } })
      .where(and(eq(mcpServers.serverId, serverId), eq(mcpServers.tenantId, tenantId)));
  }

  private toEntry(row: Row): MCPServerRegistryEntry {
    const meta = (row.metadata ?? {}) as Record<string, any>;
    return {
      server_id: row.serverId,
      tenant_id: row.tenantId,
      config: {
        server_id: row.serverId,
        tenant_id: row.tenantId,
        name: row.name,
        endpoint_url: row.endpointUrl,
        resource_identifier: row.resourceIdentifier,
        required_scopes: row.requiredScopes,
        health_check_url: row.healthCheckUrl ?? undefined,
        timeout_ms: row.timeoutMs,
        retry_attempts: row.retryAttempts,
        status: row.status,
        metadata: meta.custom,
      },
      health: meta.health
        ? { ...meta.health, last_check: new Date(meta.health.last_check) }
        : {
            server_id: row.serverId,
            status: 'unknown',
            last_check: row.createdAt,
            consecutive_failures: 0,
          },
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      last_accessed: meta.lastAccessed ? new Date(meta.lastAccessed) : row.createdAt,
      access_count: meta.accessCount ?? 0,
    };
  }
}
