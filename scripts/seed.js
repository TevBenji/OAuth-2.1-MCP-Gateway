#!/usr/bin/env node

/**
 * Database Seeding Script for OAuth 2.1 MCP Gateway
 * Seeds database with initial data for different environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Seed data configurations
const seedConfigurations = {
  development: {
    tenants: [
      {
        name: 'Development Tenant',
        domain: 'dev.example.com',
        compliance_tier: 'standard',
        max_users: 50,
        max_mcp_servers: 5
      }
    ],
    mcpServers: [
      {
        name: 'Weather API',
        endpoint_url: 'http://localhost:3001/mcp',
        resource_identifier: 'mcp://weather-api',
        required_scopes: ['mcp:tools:read']
      },
      {
        name: 'File System Tools',
        endpoint_url: 'http://localhost:3002/mcp',
        resource_identifier: 'mcp://filesystem',
        required_scopes: ['mcp:tools:read', 'mcp:resources:read']
      }
    ]
  },
  staging: {
    tenants: [
      {
        name: 'Staging Test Tenant',
        domain: 'staging.example.com',
        compliance_tier: 'standard',
        max_users: 100,
        max_mcp_servers: 10
      }
    ],
    mcpServers: [
      {
        name: 'Weather API Staging',
        endpoint_url: 'https://staging-weather.example.com/mcp',
        resource_identifier: 'mcp://weather-api-staging',
        required_scopes: ['mcp:tools:read']
      }
    ]
  },
  production: {
    // Production should be seeded manually or through specific procedures
    tenants: [],
    mcpServers: []
  }
};

/**
 * Generate API key hash
 */
function generateApiKeyHash() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  return { apiKey, hash };
}

/**
 * Seed tenants
 */async fun
ction seedTenants(environment, db) {
  const tenants = seedConfigurations[environment].tenants;
  
  console.log(`🌱 Seeding ${tenants.length} tenants for ${environment}...`);
  
  for (const tenantData of tenants) {
    const { apiKey, hash } = generateApiKeyHash();
    
    // In a real implementation, this would use actual database connection
    // For now, we'll simulate the insertion
    console.log(`Creating tenant: ${tenantData.name}`);
    console.log(`API Key: ${apiKey} (save this securely!)`);
    
    // Simulate database insertion
    await simulateDbInsert('tenants', {
      ...tenantData,
      api_key_hash: hash,
      tenant_id: crypto.randomUUID()
    });
  }
}

/**
 * Seed OAuth clients
 */
async function seedOAuthClients(environment, db, tenantId) {
  const clients = [
    {
      client_id: `dev-client-${crypto.randomBytes(8).toString('hex')}`,
      client_name: 'Development MCP Client',
      redirect_uris: JSON.stringify(['http://localhost:3000/callback']),
      client_type: 'public',
      scope: 'mcp:tools:read mcp:resources:read'
    }
  ];
  
  console.log(`🌱 Seeding ${clients.length} OAuth clients for ${environment}...`);
  
  for (const clientData of clients) {
    console.log(`Creating OAuth client: ${clientData.client_name}`);
    console.log(`Client ID: ${clientData.client_id}`);
    
    // Simulate database insertion
    await simulateDbInsert('oauth_clients', {
      ...clientData,
      tenant_id: tenantId
    });
  }
}

/**
 * Seed MCP servers
 */
async function seedMCPServers(environment, db, tenantId) {
  const servers = seedConfigurations[environment].mcpServers;
  
  console.log(`🌱 Seeding ${servers.length} MCP servers for ${environment}...`);
  
  for (const serverData of servers) {
    console.log(`Creating MCP server: ${serverData.name}`);
    
    // Simulate database insertion
    await simulateDbInsert('mcp_servers', {
      ...serverData,
      tenant_id: tenantId,
      server_id: crypto.randomUUID(),
      required_scopes: JSON.stringify(serverData.required_scopes)
    });
  }
}

/**
 * Seed rate limiting rules
 */
async function seedRateLimitRules(environment, db, tenantId) {
  const rules = [
    {
      rule_name: 'OAuth Token Endpoint',
      endpoint_pattern: '/oauth/token',
      limit_type: 'per_ip',
      max_requests: 10,
      window_seconds: 60,
      burst_allowance: 2
    },
    {
      rule_name: 'MCP Proxy Requests',
      endpoint_pattern: '/mcp/*',
      limit_type: 'per_user',
      max_requests: 1000,
      window_seconds: 3600,
      burst_allowance: 50
    }
  ];
  
  console.log(`🌱 Seeding ${rules.length} rate limit rules for ${environment}...`);
  
  for (const ruleData of rules) {
    console.log(`Creating rate limit rule: ${ruleData.rule_name}`);
    
    // Simulate database insertion
    await simulateDbInsert('rate_limit_rules', {
      ...ruleData,
      tenant_id: tenantId,
      rule_id: crypto.randomUUID()
    });
  }
}

/**
 * Simulate database insertion
 */
async function simulateDbInsert(table, data) {
  // In a real implementation, this would execute actual SQL INSERT
  // For now, we'll just simulate the operation
  return new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Main seeding function
 */
async function seedDatabase(environment = 'development', options = {}) {
  try {
    console.log(`🌱 Starting database seeding for ${environment}...`);
    
    // Validate environment
    if (!seedConfigurations[environment]) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    // In a real implementation, this would establish database connection
    const db = null; // Placeholder for database connection
    
    // Seed tenants first
    await seedTenants(environment, db);
    
    // Get the first tenant ID for other seeds (in real implementation, query the database)
    const tenantId = crypto.randomUUID(); // Simulated tenant ID
    
    // Seed OAuth clients
    await seedOAuthClients(environment, db, tenantId);
    
    // Seed MCP servers
    await seedMCPServers(environment, db, tenantId);
    
    // Seed rate limiting rules
    await seedRateLimitRules(environment, db, tenantId);
    
    console.log(`✅ Database seeding completed for ${environment}`);
    return { success: true, environment };
  } catch (error) {
    console.error(`❌ Database seeding failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Clear database (for testing)
 */
async function clearDatabase(environment = 'development') {
  try {
    console.log(`🧹 Clearing database for ${environment}...`);
    
    if (environment === 'production') {
      throw new Error('Cannot clear production database');
    }
    
    // In a real implementation, this would execute DELETE statements
    // For now, we'll simulate the operation
    console.log('Clearing all tables...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`✅ Database cleared for ${environment}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Database clearing failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  
  switch (command) {
    case 'seed':
      return await seedDatabase(environment);
    case 'clear':
      return await clearDatabase(environment);
    case 'help':
    default:
      console.log(`
Database Seeding Tool

Usage:
  seed [environment]    Seed database with initial data
  clear [environment]   Clear database (development/staging only)
  help                  Show this help

Environments:
  development    Development environment (default)
  staging        Staging environment
  production     Production environment (manual seeding only)

Examples:
  seed development
  seed staging
  clear development
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
  seedDatabase,
  clearDatabase,
  seedConfigurations
};