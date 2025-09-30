# Deployment and Infrastructure Guide

This guide covers the deployment and infrastructure automation for the OAuth 2.1 MCP Gateway.

## Overview

The OAuth 2.1 MCP Gateway uses a comprehensive deployment automation system that includes:

- **Cloudflare Workers** for edge computing deployment
- **Terraform** for infrastructure-as-code
- **GitHub Actions** for CI/CD pipeline
- **Automated testing** and verification
- **Monitoring** and alerting
- **Rollback procedures**

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **Cloudflare account** with API token
3. **Terraform** installed (optional, for infrastructure management)
4. **Git** for version control

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd oauth-mcp-gateway
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required for deployment
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_ZONE_ID="your-zone-id"

# Required for production
export PRODUCTION_JWT_SECRET="your-secure-jwt-secret"
```

### Quick Deployment

Deploy to development environment:
```bash
npm run deploy development
```

Deploy to staging:
```bash
npm run deploy staging
```

Deploy to production (requires approval):
```bash
npm run deploy production
```

## Deployment Scripts

### Main Deployment Script

The main deployment script (`scripts/deploy.js`) handles:

- Pre-deployment validation
- Database migrations
- Cloudflare Workers deployment
- Post-deployment verification
- Automatic rollback on failure

**Usage:**
```bash
# Deploy to specific environment
node scripts/deploy.js deploy <environment>

# Deploy with custom variables
node scripts/deploy.js deploy production --var=LOG_LEVEL=debug

# Validate deployment prerequisites
node scripts/deploy.js validate production

# Verify deployment health
node scripts/deploy.js verify production
```

### Infrastructure Management

The infrastructure script (`scripts/infrastructure.js`) manages Terraform:

**Usage:**
```bash
# Initialize Terraform
npm run infrastructure init

# Plan infrastructure changes
npm run infrastructure plan staging

# Apply infrastructure changes
npm run infrastructure apply production --auto-approve

# Show current state
npm run infrastructure show production

# Get outputs
npm run infrastructure outputs production
```

### Database Migrations

The migration script (`scripts/migrate.js`) handles database schema:

**Usage:**
```bash
# Apply pending migrations
npm run db:migrate up production

# Rollback migrations
npm run db:migrate down production --count=2

# Show migration status
npm run db:migrate status production

# Create new migration
npm run db:migrate create add_new_table
```

### Database Seeding

The seeding script (`scripts/seed.js`) populates initial data:

**Usage:**
```bash
# Seed database
npm run db:seed seed development

# Clear database (dev/staging only)
npm run db:seed clear development
```

## Infrastructure as Code

### Terraform Configuration

The Terraform configuration (`terraform/main.tf`) defines:

- **Cloudflare Workers** script and bindings
- **KV Namespaces** for sessions and caching
- **D1 Database** for persistent storage
- **R2 Bucket** for file storage
- **Analytics Engine** for monitoring
- **WAF Rules** for security
- **Page Rules** for performance

### Environment Variables

Each environment has its own `.tfvars` file:

- `development.tfvars` - Development settings
- `staging.tfvars` - Staging settings
- `production.tfvars` - Production settings

**Example production.tfvars:**
```hcl
environment         = "production"
domain_name         = "oauth-mcp-gateway.example.com"
log_level           = "warn"
enable_analytics    = true
enable_monitoring   = true
cors_origins        = ["https://claude.ai", "https://chatgpt.com"]
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

1. **Build and Test** - Runs on all pushes and PRs
2. **Deploy Development** - Automatic on `develop` branch
3. **Deploy Staging** - Automatic on `main` branch
4. **Deploy Production** - Manual approval required
5. **Infrastructure Management** - Manual trigger
6. **Performance Testing** - Scheduled daily
7. **Security Scanning** - Runs on all pushes

### Workflow Triggers

- **Push to develop** → Deploy to development
- **Push to main** → Deploy to staging
- **Manual dispatch** → Deploy to any environment
- **Schedule (daily 2 AM)** → Performance tests
- **Pull request** → Run tests only

### Required Secrets

Configure these secrets in GitHub:

```
# Cloudflare
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_ZONE_ID

# Environment-specific
DEVELOPMENT_JWT_SECRET
STAGING_JWT_SECRET
PRODUCTION_JWT_SECRET

# URLs for verification
DEVELOPMENT_GATEWAY_URL
STAGING_GATEWAY_URL
PRODUCTION_GATEWAY_URL

# API keys for testing
DEVELOPMENT_API_KEY
STAGING_API_KEY
PRODUCTION_API_KEY
```

## Deployment Verification

### Automated Verification

The verification script (`scripts/verify-deployment.js`) checks:

- **Readiness** - Service is responding
- **Endpoints** - All required endpoints work
- **OAuth Discovery** - Metadata is valid
- **Security Headers** - Proper security configuration
- **Performance** - Response times meet requirements

**Usage:**
```bash
# Verify deployment
npm run verify production

# The script automatically runs after deployment
```

### Manual Verification

You can also verify manually:

```bash
# Health check
curl https://oauth-mcp-gateway.example.com/health

# OAuth discovery
curl https://oauth-mcp-gateway.example.com/.well-known/oauth-authorization-server

# Performance test
npm run monitoring performance production 60000
```

## Monitoring and Alerting

### Monitoring Script

The monitoring script (`scripts/monitoring.js`) provides:

- **Health checks** - Continuous monitoring
- **Performance monitoring** - Response time tracking
- **Load testing** - Capacity verification
- **Comprehensive reports** - Detailed analysis

**Usage:**
```bash
# Health check
npm run monitoring health production

# Performance monitoring (2 minutes)
npm run monitoring performance production 120000

# Load test (20 concurrent, 1 minute)
npm run monitoring load production 20 60000

# Generate comprehensive report
npm run monitoring report production
```

### Alerting Thresholds

Each environment has different thresholds:

| Environment | Response Time | Error Rate | Availability |
|-------------|---------------|------------|--------------|
| Development | 2000ms        | 10%        | 95%          |
| Staging     | 1000ms        | 5%         | 98%          |
| Production  | 500ms         | 1%         | 99.9%        |

## Rollback Procedures

### Automatic Rollback

Production deployments automatically rollback on:
- Health check failures
- Verification test failures
- High error rates

### Manual Rollback

**Cloudflare Workers:**
```bash
# Rollback to specific version
node scripts/rollback.js cloudflare production --version=v1.2.3

# Automated rollback based on health
node scripts/rollback.js auto production
```

**Database Migrations:**
```bash
# Rollback last 2 migrations
node scripts/rollback.js database production --count=2
```

**Infrastructure:**
```bash
# Rollback infrastructure changes
cd terraform
terraform plan -destroy -var-file=production.tfvars
terraform apply -destroy
```

## Environment-Specific Configurations

### Development

- **Purpose**: Local development and testing
- **Database**: Local SQLite or D1
- **Monitoring**: Basic health checks
- **SSL**: Optional
- **Rate Limiting**: Relaxed

### Staging

- **Purpose**: Pre-production testing
- **Database**: Cloudflare D1
- **Monitoring**: Full monitoring enabled
- **SSL**: Required
- **Rate Limiting**: Production-like

### Production

- **Purpose**: Live production environment
- **Database**: Cloudflare D1 with backups
- **Monitoring**: Full monitoring + alerting
- **SSL**: Strict HTTPS only
- **Rate Limiting**: Strict limits
- **Backup**: Automatic before deployments

## Troubleshooting

### Common Issues

**Deployment fails with authentication error:**
```bash
# Check Cloudflare authentication
npx wrangler whoami

# Re-authenticate if needed
npx wrangler login
```

**Database migration fails:**
```bash
# Check migration status
npm run db:migrate status production

# Rollback problematic migration
npm run db:migrate down production --count=1
```

**Health check fails after deployment:**
```bash
# Check deployment logs
npx wrangler tail --env production

# Verify infrastructure
npm run infrastructure show production
```

### Getting Help

1. Check the deployment logs in GitHub Actions
2. Review Cloudflare Workers logs with `wrangler tail`
3. Run verification script for detailed diagnostics
4. Check monitoring reports for performance issues

## Security Considerations

### Secrets Management

- Use GitHub Secrets for sensitive data
- Rotate JWT secrets regularly
- Use different secrets per environment
- Never commit secrets to version control

### Access Control

- Limit Cloudflare API token permissions
- Use environment protection rules in GitHub
- Require manual approval for production
- Audit deployment access regularly

### Network Security

- HTTPS only in production
- Proper CORS configuration
- Security headers enabled
- WAF rules for protection

## Performance Optimization

### Edge Computing

- Deploy to Cloudflare Workers for global edge
- Use KV for session storage
- Implement proper caching strategies
- Optimize cold start times

### Database Performance

- Use connection pooling
- Implement query optimization
- Regular performance monitoring
- Proper indexing strategy

### Monitoring

- Track response times
- Monitor error rates
- Set up alerting thresholds
- Regular performance testing

This deployment system provides enterprise-grade automation with proper testing, monitoring, and rollback capabilities for the OAuth 2.1 MCP Gateway.