import { D1Database } from '@cloudflare/workers-types';

// Represents a database migration
export interface Migration {
  id: string;
  name: string;
  description: string;
  up: (db: D1Database) => Promise<void>;
  down: (db: D1Database) => Promise<void>;
  timestamp: string;
}

// Migration registry
class MigrationRegistry {
  private migrations: Map<string, Migration> = new Map();

  register(migration: Migration): void {
    this.migrations.set(migration.id, migration);
  }

  getMigration(id: string): Migration | undefined {
    return this.migrations.get(id);
  }

  getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  getUnappliedMigrations(appliedMigrationIds: string[]): Migration[] {
    const allMigrations = this.getAllMigrations();
    return allMigrations.filter(migration => 
      !appliedMigrationIds.includes(migration.id)
    );
  }
}

// Singleton instance of the migration registry
export const migrationRegistry = new MigrationRegistry();

/**
 * Migration manager handles applying and tracking database migrations
 */
export class MigrationManager {
  private db: D1Database;
  private registry: MigrationRegistry;

  constructor(db: D1Database, registry: MigrationRegistry = migrationRegistry) {
    this.db = db;
    this.registry = registry;
  }

  /**
   * Creates the necessary tables for tracking migrations
   */
  async initialize(): Promise<void> {
    // Create migrations table to track which migrations have been applied
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
  }

  /**
   * Gets a list of already applied migrations
   */
  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.prepare(
      'SELECT id FROM schema_migrations ORDER BY applied_at'
    ).all();
    
    return result.results.map((row: any) => row.id);
  }

  /**
   * Applies all unapplied migrations
   */
  async runMigrations(): Promise<void> {
    await this.initialize();
    
    const appliedMigrationIds = await this.getAppliedMigrations();
    const unappliedMigrations = this.registry.getUnappliedMigrations(appliedMigrationIds);

    for (const migration of unappliedMigrations) {
      console.log(`Applying migration: ${migration.name} (${migration.id})`);
      
      try {
        await migration.up(this.db);
        
        // Record the migration as applied
        await this.db.prepare(
          'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)'
        ).bind(
          migration.id,
          migration.name,
          new Date().toISOString()
        ).run();
        
        console.log(`Successfully applied migration: ${migration.name}`);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Rolls back the last migration
   */
  async rollbackLastMigration(): Promise<void> {
    // Get the most recently applied migration
    const appliedMigrations = await this.db.prepare(
      'SELECT id, name FROM schema_migrations ORDER BY applied_at DESC LIMIT 1'
    ).all();
    
    if (appliedMigrations.results.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = appliedMigrations.results[0] as { id: string; name: string };
    console.log(`Rolling back migration: ${lastMigration.name} (${lastMigration.id})`);
    
    const migration = this.registry.getMigration(lastMigration.id);
    if (!migration) {
      throw new Error(`Migration ${lastMigration.id} not found in registry`);
    }
    
    try {
      await migration.down(this.db);
      
      // Remove the migration from applied records
      await this.db.prepare(
        'DELETE FROM schema_migrations WHERE id = ?'
      ).bind(lastMigration.id).run();
      
      console.log(`Successfully rolled back migration: ${lastMigration.name}`);
    } catch (error) {
      console.error(`Failed to rollback migration ${lastMigration.name}:`, error);
      throw error;
    }
  }
}

// Define initial schema migration
export const initialSchemaMigration: Migration = {
  id: '20231001000000',
  name: 'Initial schema',
  description: 'Create all base tables for the OAuth 2.1 MCP Gateway',
  timestamp: '2023-10-01T00:00:00.000Z',
  up: async (db: D1Database) => {
    await db.exec(`
      -- Create tenants table
      CREATE TABLE tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        compliance_tier TEXT NOT NULL DEFAULT 'basic',
        limits TEXT, -- JSON string
        settings TEXT, -- JSON string
        status TEXT NOT NULL DEFAULT 'active'
      );

      -- Create oauth_clients table
      CREATE TABLE oauth_clients (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        client_secret TEXT,
        client_name TEXT NOT NULL,
        client_uri TEXT,
        redirect_uris TEXT, -- JSON array
        grant_types TEXT, -- JSON array
        response_types TEXT, -- JSON array
        scope TEXT,
        logo_uri TEXT,
        client_type TEXT NOT NULL DEFAULT 'public',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create authorization_codes table
      CREATE TABLE authorization_codes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        redirect_uri TEXT,
        scope TEXT,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        user_id TEXT,
        tenant_id TEXT NOT NULL,
        code_challenge TEXT,
        code_challenge_method TEXT,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create access_tokens table
      CREATE TABLE access_tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT,
        user_id TEXT,
        tenant_id TEXT NOT NULL,
        resource_indicators TEXT, -- JSON array
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create refresh_tokens table
      CREATE TABLE refresh_tokens (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        access_token_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT,
        user_id TEXT,
        tenant_id TEXT NOT NULL,
        FOREIGN KEY (access_token_id) REFERENCES access_tokens(id),
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create users table
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        external_id TEXT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        email_verified INTEGER DEFAULT 0,
        first_name TEXT,
        last_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        last_login_at TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create audit_logs table
      CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_id TEXT,
        client_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        success INTEGER DEFAULT 1,
        details TEXT, -- JSON string
        compliance_tags TEXT, -- JSON array
        tenant_id TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create mcp_servers table
      CREATE TABLE mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        access_token TEXT,
        authorization_header_name TEXT DEFAULT 'Authorization',
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      -- Create indexes for performance
      CREATE INDEX idx_oauth_clients_tenant_id ON oauth_clients(tenant_id);
      CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);
      CREATE INDEX idx_authorization_codes_code ON authorization_codes(code);
      CREATE INDEX idx_authorization_codes_tenant_id ON authorization_codes(tenant_id);
      CREATE INDEX idx_access_tokens_token ON access_tokens(token);
      CREATE INDEX idx_access_tokens_tenant_id ON access_tokens(tenant_id);
      CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id);
      CREATE INDEX idx_users_tenant_id ON users(tenant_id);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
      CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
    `);
  },
  down: async (db: D1Database) => {
    await db.exec(`
      DROP TABLE IF EXISTS mcp_servers;
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS refresh_tokens;
      DROP TABLE IF EXISTS access_tokens;
      DROP TABLE IF EXISTS authorization_codes;
      DROP TABLE IF EXISTS oauth_clients;
      DROP TABLE IF EXISTS tenants;
      DROP TABLE IF EXISTS schema_migrations;
    `);
  }
};

// Register the initial migration
migrationRegistry.register(initialSchemaMigration);