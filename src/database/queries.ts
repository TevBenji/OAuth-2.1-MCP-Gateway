import { D1Database } from '@cloudflare/workers-types';

/**
 * TenantIsolationService ensures proper isolation between tenants
 * Implements row-level security policies for multi-tenant architecture
 */
export class TenantIsolationService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Executes a tenant-aware query ensuring proper isolation
   */
  async executeTenantQuery<T>(query: string, params: any[], tenantId: string): Promise<T> {
    // Validate tenant ID
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Valid tenant ID is required');
    }

    // Ensure the query includes tenant isolation
    const isolatedQuery = this.ensureTenantIsolation(query, tenantId);

    // Execute the query
    return this.db
      .prepare(isolatedQuery)
      .bind(...params)
      .all() as Promise<T>;
  }

  /**
   * Checks if a tenant has access to a specific resource
   */
  async hasResourceAccess(
    tenantId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // This method would check if a resource belongs to a tenant
    // The implementation depends on the specific resource type

    const tableMap: Record<string, string> = {
      client: 'oauth_clients',
      user: 'users',
      token: 'access_tokens',
      mcp_server: 'mcp_servers',
      audit_log: 'audit_logs',
    };

    const tableName = tableMap[resourceType];
    if (!tableName) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    // Query to check if the resource exists and belongs to the tenant
    const query = `
      SELECT 1
      FROM ${tableName}
      WHERE id = ? AND tenant_id = ?
    `;

    const result = await this.db.prepare(query).bind(resourceId, tenantId).first();

    return !!result;
  }

  /**
   * Ensures tenant isolation by modifying the query to include tenant filters
   */
  private ensureTenantIsolation(query: string, tenantId: string): string {
    // For security, we'll ensure that any query involving tenant-aware tables
    // includes a tenant filter. This provides an additional layer of protection
    // beyond the application-level filtering.

    // List of tables that require tenant isolation
    const tenantAwareTables = [
      'tenants',
      'oauth_clients',
      'authorization_codes',
      'access_tokens',
      'refresh_tokens',
      'users',
      'audit_logs',
      'mcp_servers',
    ];

    // Check if the query involves any tenant-aware tables
    const queryLower = query.toLowerCase();
    const hasTenantAwareTable = tenantAwareTables.some(table =>
      queryLower.includes(table.toLowerCase())
    );

    if (hasTenantAwareTable) {
      // For SELECT queries, ensure a tenant filter exists
      if (/^\s*select/i.test(query)) {
        // Check if tenant filter is already present
        if (!this.hasTenantFilter(query, tenantId)) {
          // Add tenant filter
          return this.addTenantFilter(query, tenantId);
        }
      }
      // For UPDATE and DELETE, ensure tenant filter is present
      else if (/^\s*(update|delete)/i.test(query)) {
        if (!this.hasTenantFilter(query, tenantId)) {
          return this.addTenantFilter(query, tenantId);
        }
      }
    }

    return query;
  }

  /**
   * Checks if a query already has a tenant filter
   */
  private hasTenantFilter(query: string, tenantId: string): boolean {
    // This is a simplified check - in a real implementation,
    // you'd want more sophisticated query parsing
    const whereClauseMatch = /\bWHERE\b(.*)$/i;
    const whereMatch = query.match(whereClauseMatch);

    if (whereMatch) {
      // Check if the where clause contains tenant filter
      const wherePart = whereMatch[1];
      if (wherePart === undefined) return false;
      return /tenant_id\s*=/.test(wherePart);
    }

    return false;
  }

  /**
   * Adds a tenant filter to a query
   */
  private addTenantFilter(query: string, tenantId: string): string {
    if (/^\s*select/i.test(query)) {
      // For SELECT queries
      if (!/\bWHERE\b/i.test(query)) {
        // Add WHERE clause
        const orderByMatch = query.match(/\bORDER\s+BY\b/i);
        const limitMatch = query.match(/\bLIMIT\b/i);
        const groupByMatch = query.match(/\bGROUP\s+BY\b/i);

        if (orderByMatch && orderByMatch.index !== undefined) {
          const idx = orderByMatch.index;
          return `${query.substring(0, idx)} WHERE tenant_id = '${tenantId}' ${query.substring(idx)}`;
        } else if (groupByMatch && groupByMatch.index !== undefined) {
          const idx = groupByMatch.index;
          return `${query.substring(0, idx)} WHERE tenant_id = '${tenantId}' ${query.substring(idx)}`;
        } else if (limitMatch && limitMatch.index !== undefined) {
          const idx = limitMatch.index;
          return `${query.substring(0, idx)} WHERE tenant_id = '${tenantId}' ${query.substring(idx)}`;
        } else {
          return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
        }
      } else {
        // Add AND condition to existing WHERE clause
        return query.replace(/(\bWHERE\s+[^]+)/i, `$1 AND tenant_id = '${tenantId}'`);
      }
    } else if (/^\s*update/i.test(query)) {
      // For UPDATE queries
      if (!/\bWHERE\b/i.test(query)) {
        return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
      } else {
        return query.replace(/(\bWHERE\s+[^]+)/i, `$1 AND tenant_id = '${tenantId}'`);
      }
    } else if (/^\s*delete/i.test(query)) {
      // For DELETE queries
      if (!/\bWHERE\b/i.test(query)) {
        return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
      } else {
        return query.replace(/(\bWHERE\s+[^]+)/i, `$1 AND tenant_id = '${tenantId}'`);
      }
    }

    return query;
  }

  /**
   * Validates cross-tenant access attempts
   */
  async validateCrossTenantAccess(
    sourceTenantId: string,
    targetTenantId: string
  ): Promise<boolean> {
    // In a multi-tenant system, generally tenants should not access
    // resources from other tenants
    return sourceTenantId === targetTenantId;
  }

  /**
   * Gets tenant-specific statistics
   */
  async getTenantStats(tenantId: string) {
    // Get various statistics for a specific tenant
    const [clientCount, userCount, tokenCount, serverCount] = await Promise.all([
      this.db
        .prepare('SELECT COUNT(*) as count FROM oauth_clients WHERE tenant_id = ?')
        .bind(tenantId)
        .first(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?')
        .bind(tenantId)
        .first(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM access_tokens WHERE tenant_id = ?')
        .bind(tenantId)
        .first(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM mcp_servers WHERE tenant_id = ?')
        .bind(tenantId)
        .first(),
    ]);

    return {
      tenantId,
      clientCount: (clientCount as any)?.count || 0,
      userCount: (userCount as any)?.count || 0,
      tokenCount: (tokenCount as any)?.count || 0,
      serverCount: (serverCount as any)?.count || 0,
    };
  }
}

/**
 * Query builder for tenant-aware operations
 */
export class TenantQueryBuilder {
  private tenantId: string;
  private baseQuery: string;
  private params: any[] = [];
  private hasWhere: boolean = false;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.baseQuery = '';
  }

  select(fields: string = '*'): TenantQueryBuilder {
    this.baseQuery = `SELECT ${fields}`;
    return this;
  }

  from(table: string): TenantQueryBuilder {
    this.baseQuery += ` FROM ${table}`;
    return this;
  }

  where(condition: string, ...params: any[]): TenantQueryBuilder {
    if (!this.hasWhere) {
      this.baseQuery += ` WHERE ${condition}`;
      this.hasWhere = true;
    } else {
      this.baseQuery += ` AND ${condition}`;
    }

    this.params.push(...params);
    return this;
  }

  andWhere(condition: string, ...params: any[]): TenantQueryBuilder {
    this.baseQuery += ` AND ${condition}`;
    this.params.push(...params);
    return this;
  }

  orWhere(condition: string, ...params: any[]): TenantQueryBuilder {
    this.baseQuery += ` OR ${condition}`;
    this.params.push(...params);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): TenantQueryBuilder {
    this.baseQuery += ` ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(count: number): TenantQueryBuilder {
    this.baseQuery += ` LIMIT ${count}`;
    return this;
  }

  addTenantFilter(): TenantQueryBuilder {
    if (!this.hasWhere) {
      this.baseQuery += ` WHERE tenant_id = ?`;
      this.hasWhere = true;
    } else {
      this.baseQuery += ` AND tenant_id = ?`;
    }
    this.params.push(this.tenantId);
    return this;
  }

  build(): { query: string; params: any[] } {
    // Ensure tenant filter is applied
    if (!this.baseQuery.includes('tenant_id')) {
      this.addTenantFilter();
    }

    return {
      query: this.baseQuery,
      params: this.params,
    };
  }
}
