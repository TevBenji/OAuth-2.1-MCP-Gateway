#!/usr/bin/env node

/**
 * Neon Database Migration Script
 *
 * Migrates database schema to Neon (serverless PostgreSQL).
 * Converts SQLite schema to PostgreSQL-compatible schema.
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

/**
 * Convert SQLite schema to PostgreSQL
 */
function convertSQLiteToPostgreSQL(sqliteSchema) {
  let pgSchema = sqliteSchema;

  // Replace TEXT PRIMARY KEY with UUID
  pgSchema = pgSchema.replace(/(\w+)\s+TEXT\s+PRIMARY\s+KEY/gi, '$1 UUID PRIMARY KEY DEFAULT gen_random_uuid()');

  // Replace DATETIME with TIMESTAMP
  pgSchema = pgSchema.replace(/DATETIME/gi, 'TIMESTAMP');

  // Replace BOOLEAN with BOOLEAN (already compatible)
  // Replace REAL with NUMERIC or DOUBLE PRECISION
  pgSchema = pgSchema.replace(/REAL/gi, 'NUMERIC');

  // Replace INTEGER with INTEGER (already compatible)

  // Replace TEXT with TEXT or VARCHAR where appropriate
  // (TEXT is already compatible, but we might want to use VARCHAR with limits)

  // Replace CURRENT_TIMESTAMP with CURRENT_TIMESTAMP (already compatible)

  // Replace datetime('now') with CURRENT_TIMESTAMP
  pgSchema = pgSchema.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');

  // Replace lower(hex(randomblob(16))) with gen_random_uuid()
  pgSchema = pgSchema.replace(/lower\(hex\(randomblob\(\d+\)\)\)/gi, 'gen_random_uuid()');

  // Replace CHECK constraints to be PostgreSQL compatible
  // (Most CHECK constraints are already compatible)

  // Replace ON DELETE CASCADE (already compatible)

  // Remove SQLite-specific AUTOINCREMENT
  pgSchema = pgSchema.replace(/AUTOINCREMENT/gi, '');

  // Convert triggers to PostgreSQL function syntax
  pgSchema = pgSchema.replace(
    /CREATE TRIGGER IF NOT EXISTS (\w+)\s+AFTER UPDATE ON (\w+)\s+BEGIN\s+UPDATE (\w+) SET updated_at = (CURRENT_TIMESTAMP|datetime\('now'\)) WHERE (\w+) = NEW\.(\w+);\s+END;/gi,
    `CREATE OR REPLACE FUNCTION update_$2_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER $1
  BEFORE UPDATE ON $2
  FOR EACH ROW
  EXECUTE FUNCTION update_$2_timestamp();`
  );

  return pgSchema;
}

/**
 * PostgreSQL Schema for OAuth 2.1 MCP Gateway
 */
const NEON_SCHEMA = `
-- OAuth 2.1 MCP Gateway - PostgreSQL Schema for Neon
-- Multi-tenant architecture with row-level security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  compliance_tier TEXT DEFAULT 'standard' CHECK (compliance_tier IN ('standard', 'hipaa', 'pci-dss', 'sox')),
  max_users INTEGER DEFAULT 100,
  max_mcp_servers INTEGER DEFAULT 10,
  audit_retention_days INTEGER DEFAULT 365,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth clients table with PKCE support
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_secret TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  redirect_uris JSONB NOT NULL,
  grant_types JSONB NOT NULL DEFAULT '["authorization_code", "refresh_token"]'::jsonb,
  response_types JSONB NOT NULL DEFAULT '["code"]'::jsonb,
  scope TEXT,
  client_name TEXT,
  client_uri TEXT,
  logo_uri TEXT,
  contacts JSONB,
  tos_uri TEXT,
  policy_uri TEXT,
  token_endpoint_auth_method TEXT DEFAULT 'client_secret_post' CHECK (
    token_endpoint_auth_method IN ('none', 'client_secret_post', 'client_secret_basic')
  ),
  client_id_issued_at INTEGER NOT NULL,
  client_secret_expires_at INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authorization codes with PKCE challenge
CREATE TABLE IF NOT EXISTS authorization_codes (
  code TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT DEFAULT 'S256' CHECK (code_challenge_method = 'S256'),
  resource TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  scope TEXT,
  resource TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP,
  revoked_at TIMESTAMP
);

-- MCP server registry
CREATE TABLE IF NOT EXISTS mcp_servers (
  server_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  resource_identifier TEXT UNIQUE NOT NULL,
  required_scopes JSONB,
  health_check_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys with rotation support
CREATE TABLE IF NOT EXISTS api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  key_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs with compliance tagging
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  ip_address TEXT,
  user_agent TEXT,
  compliance_tags JSONB,
  risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 1),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions for user management
CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  picture TEXT,
  locale TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  UNIQUE(tenant_id, email)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id TEXT,
  client_id UUID REFERENCES oauth_clients(client_id) ON DELETE SET NULL,
  resource_id TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Tenant billing information
CREATE TABLE IF NOT EXISTS tenant_billing (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  billing_tier TEXT DEFAULT 'free' CHECK (billing_tier IN ('free', 'pro', 'business', 'enterprise')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'unpaid')),
  last_invoice_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  outstanding_balance NUMERIC DEFAULT 0.0,
  billing_email TEXT NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage alerts
CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('usage_threshold', 'billing_threshold', 'quota_exceeded')),
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('percentage', 'absolute')),
  threshold_value NUMERIC NOT NULL,
  triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL
);

-- Usage reports
CREATE TABLE IF NOT EXISTS usage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  report_data JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_clients_tenant_id ON oauth_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_client_id ON authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_expires_at ON authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client_id ON refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_resource_identifier ON mcp_servers(resource_identifier);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_id ON usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_records_action ON usage_records(action);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_tenant_id ON usage_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_triggered_at ON usage_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_resolved_at ON usage_alerts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_usage_reports_tenant_id ON usage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_reports_period_start ON usage_reports(period_start);
CREATE INDEX IF NOT EXISTS idx_usage_reports_period_end ON usage_reports(period_end);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_billing_updated_at
  BEFORE UPDATE ON tenant_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant for development
INSERT INTO tenants (name, domain)
VALUES ('Default Tenant', 'localhost')
ON CONFLICT (domain) DO NOTHING;
`;

/**
 * Apply migrations to Neon database
 */
async function applyNeonMigrations() {
  console.log('🚀 Starting Neon database migration...\n');

  try {
    // Get connection string from environment
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
    }

    console.log('📡 Connecting to Neon database...');
    const sql = neon(connectionString);

    // Apply schema
    console.log('📝 Applying PostgreSQL schema...');
    await sql(NEON_SCHEMA);

    console.log('✅ Schema applied successfully');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log(`Found ${tables.length} tables:`);
    for (const table of tables) {
      console.log(`  ✓ ${table.table_name}`);
    }

    console.log('\n✅ Neon database migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Set DATABASE_URL in Vercel environment variables');
    console.log('  2. Configure connection pooling if needed');
    console.log('  3. Set up row-level security policies for tenant isolation');
    console.log('  4. Run seed script to populate initial data');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

/**
 * Rollback Neon migrations (drops all tables)
 */
async function rollbackNeonMigrations() {
  console.log('⚠️  Starting Neon database rollback...\n');

  try {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
    }

    console.log('📡 Connecting to Neon database...');
    const sql = neon(connectionString);

    // Drop all tables in reverse order of creation
    console.log('🗑️  Dropping tables...');

    const dropTablesSQL = `
      DROP TABLE IF EXISTS usage_reports CASCADE;
      DROP TABLE IF EXISTS usage_alerts CASCADE;
      DROP TABLE IF EXISTS tenant_billing CASCADE;
      DROP TABLE IF EXISTS usage_records CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS api_keys CASCADE;
      DROP TABLE IF EXISTS mcp_servers CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS authorization_codes CASCADE;
      DROP TABLE IF EXISTS oauth_clients CASCADE;
      DROP TABLE IF EXISTS tenants CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `;

    await sql(dropTablesSQL);

    console.log('✅ All tables dropped successfully');
    console.log('\n⚠️  Database has been reset. Run migration again to recreate schema.');

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'up':
      await applyNeonMigrations();
      break;
    case 'down':
      await rollbackNeonMigrations();
      break;
    case 'help':
    default:
      console.log(`
Neon Database Migration Tool

Usage:
  up       Apply migrations to Neon database
  down     Rollback all migrations (drops all tables)
  help     Show this help

Environment Variables:
  DATABASE_URL or NEON_DATABASE_URL    Neon database connection string

Examples:
  npm run db:migrate:neon up
  npm run db:migrate:neon down
      `);
      process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  applyNeonMigrations,
  rollbackNeonMigrations,
  convertSQLiteToPostgreSQL,
  NEON_SCHEMA
};
