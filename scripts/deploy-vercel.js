#!/usr/bin/env node

/**
 * Vercel Deployment Script
 *
 * Deploy OAuth 2.1 MCP Gateway to Vercel Edge Functions.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployToVercel() {
  console.log('🚀 Deploying to Vercel...\n');

  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vercel CLI not found. Installing...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }

    // Pre-deployment checks
    console.log('📋 Running pre-deployment checks...');
    console.log('  ✅ Linting code');
    execSync('npm run lint', { stdio: 'inherit' });

    console.log('  ✅ Type checking');
    execSync('npm run type-check', { stdio: 'inherit' });

    console.log('  ✅ Running tests');
    execSync('npm run test', { stdio: 'inherit' });

    // Deploy to Vercel
    console.log('\n📦 Deploying to Vercel...');
    const deployCommand = process.env.VERCEL_ENV === 'production'
      ? 'vercel --prod'
      : 'vercel';

    execSync(deployCommand, { stdio: 'inherit' });

    console.log('\n✅ Deployment successful!');
    console.log('\nNext steps:');
    console.log('  1. Configure environment variables in Vercel dashboard');
    console.log('  2. Set up Vercel Postgres database');
    console.log('  3. Configure Vercel KV for caching');
    console.log('  4. Run database migrations');
    console.log('  5. Verify deployment at your Vercel URL');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployToVercel();
}

module.exports = { deployToVercel };
