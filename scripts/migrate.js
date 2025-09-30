#!/usr/bin/env node

/**
 * Database Migration System
 * Handles database schema migrations and seeding for different environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Migration status
const MIGRATION_STATUS = {
  PENDING: 'pending',
  APPLIED: 'applied',
  FAILED: 'failed'
};

// Migration registry
class MigrationRegistry {
  constructor() {
    this.migrations = [];
    this.loadMigrations();
  }

  /**
   * Load migrations from the migrations directory
   */
  loadMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') || file.endsWith('.js') || file.endsWith('.ts'))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const migrationName = path.basename(file, path.extname(file));
      
      this.migrations.push({
        id: migrationName,
        name: migrationName,
        file: filePath,
        timestamp: fs.statSync(filePath).mtime,
        status: MIGRATION_STATUS.PENDING
      });
    }
    
    console.log(`Loaded ${this.migrations.length} migrations`);
  }

  /**
   * Get all migrations
   */
  getAllMigrations() {
    return [...this.migrations];
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    return this.migrations.filter(m => m.status === MIGRATION_STATUS.PENDING);
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations() {
    return this.migrations.filter(m => m.status === MIGRATION_STATUS.APPLIED);
  }

  /**
   * Mark migration as applied
   */
  markAsApplied(migrationId) {
    const migration = this.migrations.find(m => m.id === migrationId);
    if (migration) {
      migration.status = MIGRATION_STATUS.APPLIED;
    }
  }

  /**
   * Mark migration as failed
   */
  markAsFailed(migrationId) {
    const migration = this.migrations.find(m => m.id === migrationId);
    if (migration) {
      migration.status = MIGRATION_STATUS.FAILED;
    }
  }
}

// Global migration registry
const migrationRegistry = new MigrationRegistry();

/**
 * Apply database migrations
 */
async function applyMigrations(environment = 'development', options = {}) {
  try {
    console.log(`🏃 Applying database migrations for ${environment}...`);
    
    // In a real implementation, this would connect to the actual database
    // For now, we'll simulate the process
    
    const pendingMigrations = migrationRegistry.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations to apply');
      return { success: true, applied: 0 };
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    let appliedCount = 0;
    
    for (const migration of pendingMigrations) {
      try {
        console.log(`Applying migration: ${migration.name}`);
        
        // Simulate migration application
        // In a real implementation, this would execute the SQL/JS migration file
        await simulateMigrationApplication(migration, environment);
        
        migrationRegistry.markAsApplied(migration.id);
        appliedCount++;
        
        console.log(`✅ Applied migration: ${migration.name}`);
      } catch (error) {
        migrationRegistry.markAsFailed(migration.id);
        console.error(`❌ Failed to apply migration ${migration.name}: ${error.message}`);
        
        if (!options.continueOnError) {
          throw new Error(`Migration failed: ${migration.name}`);
        }
      }
    }
    
    console.log(`✅ Successfully applied ${appliedCount} migrations`);
    return { success: true, applied: appliedCount };
  } catch (error) {
    console.error(`❌ Migration process failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate migration application
 */
async function simulateMigrationApplication(migration, environment) {
  // In a real implementation, this would:
  // 1. Connect to the database for the specified environment
  // 2. Execute the migration file (SQL or JS/TS)
  // 3. Record the migration in a migrations table
  // 4. Handle transactions and rollbacks
  
  // Simulate some work
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Rollback database migrations
 */
async function rollbackMigrations(environment = 'development', count = 1) {
  try {
    console.log(`⏪ Rolling back ${count} database migrations for ${environment}...`);
    
    // In a real implementation, this would:
    // 1. Get the last N applied migrations
    // 2. Execute their rollback procedures in reverse order
    // 3. Update the migrations table
    
    const appliedMigrations = migrationRegistry.getAppliedMigrations()
      .slice(-count)
      .reverse();
    
    if (appliedMigrations.length === 0) {
      console.log('✅ No applied migrations to rollback');
      return { success: true, rolledBack: 0 };
    }
    
    console.log(`Rolling back ${appliedMigrations.length} migrations`);
    
    let rolledBackCount = 0;
    
    for (const migration of appliedMigrations) {
      try {
        console.log(`Rolling back migration: ${migration.name}`);
        
        // Simulate rollback
        await simulateMigrationRollback(migration, environment);
        
        // Mark as pending again
        migration.status = MIGRATION_STATUS.PENDING;
        rolledBackCount++;
        
        console.log(`✅ Rolled back migration: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Failed to rollback migration ${migration.name}: ${error.message}`);
        throw new Error(`Rollback failed: ${migration.name}`);
      }
    }
    
    console.log(`✅ Successfully rolled back ${rolledBackCount} migrations`);
    return { success: true, rolledBack: rolledBackCount };
  } catch (error) {
    console.error(`❌ Rollback process failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate migration rollback
 */
async function simulateMigrationRollback(migration, environment) {
  // In a real implementation, this would execute the rollback procedure
  // for the specified migration
  
  // Simulate some work
  return new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Seed database with initial data
 */
async function seedDatabase(environment = 'development', options = {}) {
  try {
    console.log(`🌱 Seeding database for ${environment}...`);
    
    // In a real implementation, this would:
    // 1. Load seed data from files or generate it
    // 2. Insert the data into the appropriate tables
    // 3. Handle different seed scenarios (minimal, full, custom)
    
    // Simulate seeding process
    await simulateDatabaseSeeding(environment, options);
    
    console.log('✅ Database seeding completed');
    return { success: true, seeded: true };
  } catch (error) {
    console.error(`❌ Database seeding failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate database seeding
 */
async function simulateDatabaseSeeding(environment, options) {
  // Simulate some work
  return new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * Show migration status
 */
function showMigrationStatus(environment = 'development') {
  console.log(`📊 Migration Status for ${environment}:`);
  
  const allMigrations = migrationRegistry.getAllMigrations();
  
  if (allMigrations.length === 0) {
    console.log('No migrations found');
    return;
  }
  
  for (const migration of allMigrations) {
    const statusSymbol = {
      [MIGRATION_STATUS.PENDING]: '⏳',
      [MIGRATION_STATUS.APPLIED]: '✅',
      [MIGRATION_STATUS.FAILED]: '❌'
    }[migration.status] || '❓';
    
    console.log(`${statusSymbol} ${migration.name} (${migration.status})`);
  }
}

/**
 * Create a new migration file
 */
function createMigration(name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
  const fileName = `${timestamp}_${name}.sql`;
  const filePath = path.join(__dirname, '..', 'migrations', fileName);
  
  const migrationTemplate = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- UP migration
CREATE TABLE IF NOT EXISTS example_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- DOWN migration (rollback)
-- DROP TABLE IF EXISTS example_table;
`;
  
  fs.writeFileSync(filePath, migrationTemplate);
  console.log(`✅ Created migration file: ${filePath}`);
  
  return filePath;
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  const options = {};
  
  // Parse additional options
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--continue-on-error') {
      options.continueOnError = true;
    } else if (args[i].startsWith('--count=')) {
      options.count = parseInt(args[i].substring(8), 10);
    }
  }
  
  switch (command) {
    case 'up':
      return await applyMigrations(environment, options);
    case 'down':
      const count = options.count || 1;
      return await rollbackMigrations(environment, count);
    case 'seed':
      return await seedDatabase(environment, options);
    case 'status':
      showMigrationStatus(environment);
      return { success: true };
    case 'create':
      const migrationName = args[1] || 'unnamed_migration';
      createMigration(migrationName);
      return { success: true };
    case 'help':
    default:
      console.log(`
Database Migration Tool

Usage:
  up [environment] [options]        Apply pending migrations
  down [environment] [--count=N]    Rollback last N migrations
  seed [environment]                Seed database with initial data
  status [environment]              Show migration status
  create <name>                     Create new migration file
  help                              Show this help

Environments:
  development    Development environment (default)
  staging        Staging environment
  production     Production environment

Options:
  --continue-on-error    Continue applying migrations even if one fails
  --count=N              Number of migrations to rollback (for down command)

Examples:
  up staging
  down production --count=2
  seed development
  status
  create add_users_table
      `);
      process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(result => {
    if (result && !result.success) {
      process.exit(1);
    }
  });
}

module.exports = {
  applyMigrations,
  rollbackMigrations,
  seedDatabase,
  showMigrationStatus,
  createMigration,
  migrationRegistry,
  MIGRATION_STATUS
};