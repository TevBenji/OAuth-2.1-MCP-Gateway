#!/usr/bin/env node

/**
 * Database Setup Script for OAuth 2.1 MCP Gateway
 * This script helps you set up your Neon PostgreSQL database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  step: (msg) => console.log(`\n${colors.bright}${colors.blue}→${colors.reset} ${colors.bright}${msg}${colors.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkEnvFile() {
  log.step('Checking environment configuration...');

  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    log.error('.env.local file not found!');
    log.info('Creating .env.local from example...');

    const examplePath = path.join(__dirname, '.env.local.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      log.success('.env.local created from example');
    } else {
      log.error('No example file found. Please create .env.local manually.');
      return false;
    }
  }

  // Load and check environment variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasValidDB = envContent.includes('postgresql://') &&
                     !envContent.includes('YOUR_NEON_CONNECTION_STRING_HERE') &&
                     !envContent.includes('test:test@localhost');

  if (!hasValidDB) {
    log.warning('Database connection string not configured!');
    log.info('\nTo get your Neon database connection string:');
    console.log(`
  1. Go to ${colors.cyan}https://console.neon.tech${colors.reset}
  2. Select your project (or create one)
  3. Copy the connection string from the dashboard
  4. Update DATABASE_URL and DIRECT_URL in .env.local
    `);

    const proceed = await question(`\nDo you want to continue anyway? (y/n): `);
    if (proceed.toLowerCase() !== 'y') {
      log.info('Please update your .env.local file and run this script again.');
      return false;
    }
  } else {
    log.success('Database connection configured');
  }

  const hasClerk = envContent.includes('pk_test_') &&
                   !envContent.includes('PASTE_YOUR_PUBLISHABLE_KEY_HERE');

  if (!hasClerk) {
    log.warning('Clerk authentication not configured!');
    log.info('\nTo get your Clerk keys:');
    console.log(`
  1. Go to ${colors.cyan}https://dashboard.clerk.com${colors.reset}
  2. Select your "oauth-mcp-gateway" project
  3. Go to "API Keys" in the sidebar
  4. Copy your keys and update .env.local
    `);
  } else {
    log.success('Clerk authentication configured');
  }

  return true;
}

async function runCommand(command, description) {
  log.step(description);
  try {
    execSync(command, { stdio: 'inherit' });
    log.success(`${description} completed`);
    return true;
  } catch (error) {
    log.error(`Failed to ${description.toLowerCase()}`);
    console.error(error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log(`
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}
${colors.bright}     OAuth 2.1 MCP Gateway - Database Setup${colors.reset}
${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}
`);

  // Check environment
  const envOk = await checkEnvFile();
  if (!envOk) {
    rl.close();
    process.exit(1);
  }

  // Check if pnpm is installed
  log.step('Checking pnpm installation...');
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    log.success('pnpm is installed');
  } catch {
    log.error('pnpm is not installed!');
    log.info('Install pnpm with: npm install -g pnpm');
    rl.close();
    process.exit(1);
  }

  // Install dependencies if needed
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    await runCommand('pnpm install', 'Installing dependencies');
  }

  // Generate Prisma Client
  const generateSuccess = await runCommand(
    'pnpm prisma generate',
    'Generating Prisma Client'
  );

  if (!generateSuccess) {
    log.error('Failed to generate Prisma client');
    rl.close();
    process.exit(1);
  }

  // Push database schema
  log.step('Pushing database schema to Neon...');
  log.info('This will create all necessary tables in your database');

  const pushSuccess = await runCommand(
    'pnpm prisma db push --skip-generate',
    'Creating database tables'
  );

  if (!pushSuccess) {
    log.error('Failed to push database schema');
    log.info('\nPossible issues:');
    log.info('1. Check your Neon connection string in .env.local');
    log.info('2. Make sure your Neon project is active');
    log.info('3. Check that the connection string includes ?sslmode=require');
    rl.close();
    process.exit(1);
  }

  // Optional: Seed database
  log.step('Database setup complete!');
  const seedAnswer = await question('\nWould you like to seed the database with sample data? (y/n): ');

  if (seedAnswer.toLowerCase() === 'y') {
    // Create a simple seed file if it doesn't exist
    const seedPath = path.join(__dirname, 'prisma', 'seed.ts');
    if (!fs.existsSync(seedPath)) {
      log.info('Creating seed file...');
      const seedContent = `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Add seed data here
  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
      fs.writeFileSync(seedPath, seedContent);
    }

    await runCommand('pnpm prisma db seed', 'Seeding database');
  }

  // Success message
  console.log(`
${colors.green}═══════════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.green}     ✨ Database Setup Complete! ✨${colors.reset}
${colors.green}═══════════════════════════════════════════════════════════${colors.reset}

${colors.bright}What's next?${colors.reset}

  1. Start the development server:
     ${colors.cyan}pnpm dev${colors.reset}

  2. Open your browser:
     ${colors.cyan}http://localhost:3000${colors.reset}

  3. Sign up for an account and explore!

${colors.bright}Useful commands:${colors.reset}

  ${colors.cyan}pnpm prisma studio${colors.reset}    - Visual database editor
  ${colors.cyan}pnpm dev${colors.reset}             - Start development server
  ${colors.cyan}pnpm build${colors.reset}           - Build for production

${colors.bright}Need help?${colors.reset}
  - Check the setup guide: ${colors.cyan}setup.md${colors.reset}
  - Read the README: ${colors.cyan}README.md${colors.reset}

${colors.green}Happy coding! 🚀${colors.reset}
`);

  rl.close();
}

// Run the setup
setupDatabase().catch((error) => {
  log.error('Setup failed:');
  console.error(error);
  rl.close();
  process.exit(1);
});
