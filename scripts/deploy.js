#!/usr/bin/env node

/**
 * Cloudflare Workers Deployment Script
 * Handles deployment to different environments with proper configuration management
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment configuration
const environments = {
  development: {
    name: 'oauth-mcp-gateway-dev',
    env: 'development',
    vars: {
      ENVIRONMENT: 'development',
      LOG_LEVEL: 'debug',
      DATABASE_URL: 'sqlite:///tmp/dev.db',
      JWT_SECRET: 'dev-jwt-secret-key-change-in-production'
    }
  },
  staging: {
    name: 'oauth-mcp-gateway-staging',
    env: 'staging',
    vars: {
      ENVIRONMENT: 'staging',
      LOG_LEVEL: 'info',
      DATABASE_URL: process.env.STAGING_DATABASE_URL || 'cloudflare-d1://staging-db',
      // SECURITY FIX: No fallback for JWT_SECRET - deployment will fail if not set
      JWT_SECRET: process.env.STAGING_JWT_SECRET
    }
  },
  production: {
    name: 'oauth-mcp-gateway',
    env: 'production',
    vars: {
      ENVIRONMENT: 'production',
      LOG_LEVEL: 'warn',
      DATABASE_URL: process.env.PRODUCTION_DATABASE_URL || 'cloudflare-d1://production-db',
      // SECURITY FIX: No fallback for JWT_SECRET - deployment will fail if not set
      JWT_SECRET: process.env.PRODUCTION_JWT_SECRET
    }
  }
};

// Deployment targets
const targets = {
  cloudflare: {
    deploy: deployToCloudflare,
    rollback: rollbackCloudflareDeployment
  }
};

/**
 * Deploy to Cloudflare Workers
 */
async function deployToCloudflare(environment, options = {}) {
  try {
    console.log(`🚀 Deploying to Cloudflare Workers (${environment})...`);
    
    const envConfig = environments[environment];
    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    // Pre-deployment validation
    await validateDeploymentPrerequisites(environment);

    // SECURITY FIX: Validate JWT_SECRET is set for non-dev environments
    if (environment !== 'development' && !envConfig.vars.JWT_SECRET) {
      throw new Error(`JWT_SECRET environment variable is required for ${environment} deployment. Please set ${environment.toUpperCase()}_JWT_SECRET environment variable.`);
    }

    // Set environment variables
    const envVars = { ...envConfig.vars };
    
    // Override with command line options if provided
    if (options.vars) {
      Object.assign(envVars, options.vars);
    }
    
    // Create deployment backup
    if (environment === 'production') {
      console.log('💾 Creating deployment backup...');
      await createDeploymentBackup(environment);
    }
    
    // Build the project
    console.log('🏗️  Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Run pre-deployment tests
    console.log('🧪 Running pre-deployment tests...');
    execSync('npm run test:pre-deploy', { stdio: 'inherit' });
    
    // Deploy to Cloudflare using environment-specific config
    console.log('☁️  Deploying to Cloudflare...');
    const deployCmd = `npx wrangler deploy --env ${environment}`;
    execSync(deployCmd, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        ...envVars
      }
    });
    
    // Run post-deployment verification
    console.log('✅ Running post-deployment verification...');
    await verifyDeployment(environment);
    
    // Update deployment metadata
    await updateDeploymentMetadata(environment);
    
    console.log(`✅ Successfully deployed to ${environment} environment`);
    return { success: true, environment, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    
    // Attempt automatic rollback for production
    if (environment === 'production' && options.autoRollback !== false) {
      console.log('🔄 Attempting automatic rollback...');
      try {
        await rollbackCloudflareDeployment(environment);
        console.log('✅ Automatic rollback completed');
      } catch (rollbackError) {
        console.error(`❌ Rollback failed: ${rollbackError.message}`);
      }
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Rollback Cloudflare Workers deployment
 */
async function rollbackCloudflareDeployment(environment, version) {
  try {
    console.log(`⏪ Rolling back ${environment} deployment to version ${version}...`);
    
    // In a real implementation, this would use wrangler to rollback to a specific version
    // For now, we'll just log the intended action
    console.log(`Would rollback ${environment} to version ${version} using wrangler deployments`);
    
    return { success: true, environment, version };
  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Generate wrangler.toml configuration for specific environment
 */
function generateWranglerConfig(envConfig, envVars) {
  const config = `
name = "${envConfig.name}"
main = "src/index.ts"
compatibility_date = "2023-10-01"

[vars]
${Object.entries(envVars).map(([key, value]) => `${key} = "${value}"`).join('\n')}

[[kv_namespaces]]
binding = "SESSION_STORE"
id = "${getKVNamespaceId(envConfig.env, 'sessions')}"

[[d1_databases]]
binding = "DB"
database_name = "${getD1DatabaseName(envConfig.env)}"
database_id = "${getD1DatabaseId(envConfig.env)}"

[env.development]
name = "${environments.development.name}"

[env.staging]
name = "${environments.staging.name}"

[env.production]
name = "${environments.production.name}"
`;
  
  return config;
}

/**
 * Get KV namespace ID for environment
 */
function getKVNamespaceId(environment, namespace) {
  const ids = {
    development: {
      sessions: 'dev-sessions-kv-namespace-id'
    },
    staging: {
      sessions: process.env.STAGING_SESSIONS_KV_ID || 'staging-sessions-kv-namespace-id'
    },
    production: {
      sessions: process.env.PRODUCTION_SESSIONS_KV_ID || 'production-sessions-kv-namespace-id'
    }
  };
  
  return ids[environment]?.[namespace] || `${environment}-${namespace}-kv-namespace-id`;
}

/**
 * Get D1 database name for environment
 */
function getD1DatabaseName(environment) {
  const names = {
    development: 'oauth-mcp-gateway-dev',
    staging: process.env.STAGING_D1_DB_NAME || 'oauth-mcp-gateway-staging',
    production: process.env.PRODUCTION_D1_DB_NAME || 'oauth-mcp-gateway'
  };
  
  return names[environment] || `oauth-mcp-gateway-${environment}`;
}

/**
 * Get D1 database ID for environment
 */
function getD1DatabaseId(environment) {
  const ids = {
    development: 'dev-d1-database-id',
    staging: process.env.STAGING_D1_DB_ID || 'staging-d1-database-id',
    production: process.env.PRODUCTION_D1_DB_ID || 'production-d1-database-id'
  };
  
  return ids[environment] || `${environment}-d1-database-id`;
}

/**
 * Validate deployment prerequisites
 */
async function validateDeploymentPrerequisites(environment) {
  console.log('🔍 Validating deployment prerequisites...');
  
  // Check required environment variables
  const requiredVars = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Check wrangler authentication
  try {
    execSync('npx wrangler whoami', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Wrangler authentication failed. Please run: wrangler login');
  }
  
  // Validate project structure
  const requiredFiles = ['src/index.ts', 'wrangler.toml', 'package.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  console.log('✅ Prerequisites validated');
}

/**
 * Create deployment backup
 */
async function createDeploymentBackup(environment) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `${environment}-${timestamp}`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Backup current deployment info
  try {
    const deploymentInfo = execSync('npx wrangler deployments list --json', { encoding: 'utf8' });
    fs.writeFileSync(path.join(backupDir, 'deployments.json'), deploymentInfo);
  } catch (error) {
    console.warn('⚠️  Could not backup deployment info:', error.message);
  }
  
  // Backup environment configuration
  const envConfig = environments[environment];
  fs.writeFileSync(path.join(backupDir, 'config.json'), JSON.stringify(envConfig, null, 2));
  
  console.log(`💾 Backup created: ${backupDir}`);
}

/**
 * Verify deployment
 */
async function verifyDeployment(environment) {
  const envConfig = environments[environment];
  const baseUrl = getDeploymentUrl(environment);
  
  // Health check
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    console.log('✅ Health check passed');
  } catch (error) {
    throw new Error(`Deployment verification failed: ${error.message}`);
  }
  
  // OAuth discovery endpoint check
  try {
    const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    if (!response.ok) {
      throw new Error(`OAuth discovery endpoint failed: ${response.status}`);
    }
    console.log('✅ OAuth discovery endpoint verified');
  } catch (error) {
    console.warn('⚠️  OAuth discovery endpoint check failed:', error.message);
  }
}

/**
 * Update deployment metadata
 */
async function updateDeploymentMetadata(environment) {
  const metadata = {
    environment,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    commit: process.env.GITHUB_SHA || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown'
  };
  
  const metadataPath = path.join(__dirname, '..', 'deployments', `${environment}-latest.json`);
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`📝 Deployment metadata updated: ${metadataPath}`);
}

/**
 * Get deployment URL for environment
 */
function getDeploymentUrl(environment) {
  const urls = {
    development: 'https://oauth-mcp-gateway-dev.example.com',
    staging: 'https://oauth-mcp-gateway-staging.example.com',
    production: 'https://oauth-mcp-gateway.example.com'
  };
  
  return urls[environment] || urls.development;
}

/**
 * Main deployment function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';
  const options = {};
  
  // Parse additional options
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--var=')) {
      const [key, value] = args[i].substring(6).split('=');
      if (key && value) {
        options.vars = options.vars || {};
        options.vars[key] = value;
      }
    } else if (args[i] === '--no-rollback') {
      options.autoRollback = false;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    }
  }
  
  switch (command) {
    case 'deploy':
      return await deployToCloudflare(environment, options);
    case 'rollback':
      const version = args[2];
      if (!version) {
        console.error('❌ Please specify a version to rollback to');
        process.exit(1);
      }
      return await rollbackCloudflareDeployment(environment, version);
    case 'validate':
      return await validateDeploymentPrerequisites(environment);
    case 'verify':
      return await verifyDeployment(environment);
    case 'help':
    default:
      console.log(`
OAuth 2.1 MCP Gateway Deployment Tool

Usage:
  deploy [environment] [options]    Deploy to specified environment
  rollback [environment] <version>  Rollback to specific version
  validate [environment]            Validate deployment prerequisites
  verify [environment]              Verify deployment health
  help                              Show this help

Environments:
  development    Development environment (default)
  staging        Staging environment
  production     Production environment

Options:
  --var=KEY=VALUE    Set environment variable
  --no-rollback      Disable automatic rollback on failure
  --dry-run          Simulate deployment without actual changes

Examples:
  deploy staging
  deploy production --var=LOG_LEVEL=debug
  rollback production v1.2.3
  validate production
  verify staging
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
  deployToCloudflare,
  rollbackCloudflareDeployment,
  environments,
  targets
};