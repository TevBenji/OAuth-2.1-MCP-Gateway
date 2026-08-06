import { D1Database } from '@cloudflare/workers-types';

/**
 * Tenant-aware database connection management
 * Handles connection pooling and tenant context for multi-tenant architecture
 */

export interface DatabaseConfig {
  databaseName: string;
  // Add other database config properties as needed
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  requestId: string;
}

/**
 * DatabaseManager class for handling multi-tenant database operations
 */
export class DatabaseManager {
  private database: D1Database;
  private tenantContext?: TenantContext;

  constructor(database: D1Database) {
    this.database = database;
  }

  /**
   * Sets the tenant context for subsequent database operations
   */
  setTenantContext(context: TenantContext): void {
    this.tenantContext = context;
  }

  /**
   * Gets the current tenant context
   */
  getTenantContext(): TenantContext | undefined {
    return this.tenantContext;
  }

  /**
   * Gets the underlying database instance
   */
  getDatabase(): D1Database {
    return this.database;
  }

  /**
   * Executes a query with tenant isolation
   * Automatically adds tenant filtering to queries where applicable
   */
  async executeWithTenant<T>(
    query: string, 
    params?: any[],
    tenantId?: string
  ): Promise<T> {
    const actualTenantId = tenantId || this.tenantContext?.tenantId;
    
    if (!actualTenantId) {
      throw new Error('Tenant ID is required for database operations');
    }

    // Add tenant filter to the query
    const tenantQuery = this.addTenantFilter(query, actualTenantId);
    return this.database.prepare(tenantQuery).bind(...(params || [])).all() as Promise<T>;
  }

  /**
   * Adds tenant filtering to a SQL query
   * This ensures row-level security by automatically adding tenant_id filters
   */
  private addTenantFilter(query: string, tenantId: string): string {
    // This is a simplified approach - in a real implementation, 
    // you'd want more sophisticated query parsing
    
    // For SELECT, INSERT, UPDATE, DELETE statements that reference tenant-aware tables
    // add the tenant_id filter
    
    // Check if query contains tenant-aware tables
    const tenantAwareTables = [
      'tenants', 'oauth_clients', 'authorization_codes', 
      'access_tokens', 'refresh_tokens', 'users', 
      'audit_logs', 'mcp_servers'
    ];
    
    const hasTenantAwareTable = tenantAwareTables.some(table => 
      new RegExp(`\\b${table}\\b`, 'i').test(query)
    );
    
    if (hasTenantAwareTable) {
      // For SELECT queries
      if (/^\s*SELECT/i.test(query)) {
        // Check if WHERE clause already exists
        const whereIndex = query.toLowerCase().indexOf('where');
        if (whereIndex === -1) {
          // Add WHERE clause before any ORDER BY, GROUP BY, or LIMIT
          const orderByIndex = query.toLowerCase().indexOf('order by');
          const groupByIndex = query.toLowerCase().indexOf('group by');
          const limitIndex = query.toLowerCase().indexOf('limit');
          
          // Find the earliest occurrence of post-SELECT clauses
          const endIndexes = [orderByIndex, groupByIndex, limitIndex].filter(i => i !== -1);
          const earliestEndIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : -1;
          
          if (earliestEndIndex !== -1) {
            // Insert WHERE clause before the first post-SELECT clause
            const prefix = query.substring(0, earliestEndIndex);
            const suffix = query.substring(earliestEndIndex);
            return `${prefix} WHERE tenant_id = '${tenantId}' ${suffix}`;
          } else {
            // No post-SELECT clauses, append at end
            return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
          }
        } else {
          // Add AND condition to existing WHERE clause
          // Find where the WHERE clause ends (before next clause)
          const remainingQuery = query.substring(whereIndex + 5); // after "WHERE"
          const orderByIndex = remainingQuery.toLowerCase().indexOf('order by');
          const groupByIndex = remainingQuery.toLowerCase().indexOf('group by');
          const limitIndex = remainingQuery.toLowerCase().indexOf('limit');
          
          const endIndexes = [orderByIndex, groupByIndex, limitIndex].filter(i => i !== -1);
          let clauseEndIndex = -1;
          if (endIndexes.length > 0) {
            clauseEndIndex = Math.min(...endIndexes);
          }
          
          if (clauseEndIndex !== -1) {
            // Insert the AND condition before the next clause
            const prefix = query.substring(0, whereIndex + 5); // include "WHERE"
            const whereClause = query.substring(whereIndex + 5, whereIndex + 5 + clauseEndIndex);
            const suffix = query.substring(whereIndex + 5 + clauseEndIndex);
            return `${prefix} ${whereClause} AND tenant_id = '${tenantId}' ${suffix}`;
          } else {
            // WHERE clause goes to end of query
            return query.replace(/;?\s*$/, ` AND tenant_id = '${tenantId}'`);
          }
        }
      }
      // For UPDATE queries
      else if (/^\s*UPDATE/i.test(query)) {
        const whereIndex = query.toLowerCase().indexOf('where');
        if (whereIndex === -1) {
          // Add WHERE clause at the end
          return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
        } else {
          // Add AND condition to existing WHERE clause
          return query.replace(/(\bWHERE\s+[^]+)/i, `$1 AND tenant_id = '${tenantId}'`);
        }
      }
      // For DELETE queries
      else if (/^\s*DELETE/i.test(query)) {
        const whereIndex = query.toLowerCase().indexOf('where');
        if (whereIndex === -1) {
          // Add WHERE clause at the end
          return query.replace(/;?\s*$/, ` WHERE tenant_id = '${tenantId}'`);
        } else {
          // Add AND condition to existing WHERE clause
          return query.replace(/(\bWHERE\s+[^]+)/i, `$1 AND tenant_id = '${tenantId}'`);
        }
      }
    }
    
    return query;
  }

  /**
   * Validates that the provided tenant ID is valid
   */
  async validateTenantId(tenantId: string): Promise<boolean> {
    if (!tenantId) {
      return false;
    }

    // In a real implementation, you would check against your tenants table
    // For now, we'll assume all non-empty tenant IDs are valid
    const result = await this.database
      .prepare('SELECT 1 FROM tenants WHERE id = ? AND status = \'active\'')
      .bind(tenantId)
      .first();
    
    return !!result;
  }

  /**
   * Creates a new tenant context for a database transaction
   */
  async withTenantContext<T>(
    tenantId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const isValid = await this.validateTenantId(tenantId);
    if (!isValid) {
      throw new Error(`Invalid or inactive tenant ID: ${tenantId}`);
    }

    const previousContext = this.tenantContext;
    this.tenantContext = { tenantId, requestId: crypto.randomUUID() };

    try {
      return await operation();
    } finally {
      this.tenantContext = previousContext;
    }
  }

  /**
   * Execute a raw SQL query with parameters
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.database.prepare(sql).bind(...params).all();
    return (result.results || []) as T[];
  }

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params: any[] = []): Promise<{ rowsAffected: number; lastRowId?: number }> {
    const result = await this.database.prepare(sql).bind(...params).run();
    return {
      rowsAffected: result.meta.changes || 0,
      lastRowId: result.meta.last_row_id,
    };
  }
}

// Export a function to create a database manager instance
export function createDatabaseManager(database: D1Database): DatabaseManager {
  return new DatabaseManager(database);
}