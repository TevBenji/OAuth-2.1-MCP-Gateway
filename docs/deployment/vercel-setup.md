# Vercel Deployment Setup Guide

Complete guide to deploy OAuth 2.1 MCP Gateway to Vercel with Neon database.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Vercel CLI**: Install globally via `npm install -g vercel`
3. **Neon Account**: Sign up at https://neon.tech
4. **GitHub Repository**: Code must be in a Git repository

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project

```bash
# Login to Neon dashboard
1. Go to https://console.neon.tech
2. Create a new project
3. Choose region (closest to your users)
4. Copy the connection string
```

### 1.2 Configure Connection String

```bash
# Development
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Staging
NEON_DATABASE_URL_STAGING=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb_staging?sslmode=require

# Production
NEON_DATABASE_URL_PRODUCTION=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb_production?sslmode=require
```

### 1.3 Run Database Migrations

```bash
# Development
export DATABASE_URL=postgresql://...
npm run db:migrate:neon up

# Staging
export DATABASE_URL=$NEON_DATABASE_URL_STAGING
npm run db:migrate:neon up

# Production (with caution)
export DATABASE_URL=$NEON_DATABASE_URL_PRODUCTION
npm run db:migrate:neon up
```

## Step 2: Configure Vercel Project

### 2.1 Initialize Vercel Project

```bash
# Link local project to Vercel
vercel link

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account/team
# - Link to existing project? No (first time) / Yes (existing)
# - What's your project's name? oauth-mcp-gateway
# - In which directory is your code located? ./
```

### 2.2 Set Environment Variables

```bash
# Via Vercel CLI
vercel env add DATABASE_URL production
# Paste your Neon production connection string

vercel env add JWT_SECRET production
# Enter a secure random string (use: openssl rand -base64 32)

vercel env add JWT_ISSUER production
# Enter: https://your-domain.com

vercel env add CORS_ORIGINS production
# Enter: https://app.your-domain.com,https://dashboard.your-domain.com

# Repeat for preview (staging) and development
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

### 2.3 Configure via Vercel Dashboard

```
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables for each environment:

Production:
  - DATABASE_URL: [Neon production connection string]
  - JWT_SECRET: [Secure random string]
  - JWT_ISSUER: https://your-domain.com
  - CORS_ORIGINS: https://app.your-domain.com
  - ENVIRONMENT: production

Preview (Staging):
  - DATABASE_URL: [Neon staging connection string]
  - JWT_SECRET: [Different secure random string]
  - JWT_ISSUER: https://staging-your-domain.com
  - CORS_ORIGINS: https://staging-app.your-domain.com
  - ENVIRONMENT: staging

Development:
  - DATABASE_URL: [Neon dev connection string]
  - JWT_SECRET: [Dev secret]
  - JWT_ISSUER: http://localhost:3000
  - CORS_ORIGINS: http://localhost:3000,http://localhost:8080
  - ENVIRONMENT: development
```

## Step 3: Deploy to Vercel

### 3.1 Manual Deployment

```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

### 3.2 Automated Deployment via GitHub

```bash
# 1. Connect repository to Vercel
#    - Go to Vercel dashboard → Import Project
#    - Connect your GitHub repository
#    - Configure build settings (auto-detected from vercel.json)

# 2. Set up GitHub Secrets
#    Go to GitHub repository → Settings → Secrets → Actions
#    Add the following secrets:

VERCEL_TOKEN:              [Get from: vercel tokens create]
VERCEL_ORG_ID:             [Get from: .vercel/project.json]
VERCEL_PROJECT_ID:         [Get from: .vercel/project.json]
NEON_DATABASE_URL_DEV:     [Development database URL]
NEON_DATABASE_URL_STAGING: [Staging database URL]
NEON_DATABASE_URL_PRODUCTION: [Production database URL]
```

### 3.3 GitHub Actions Workflow

The project includes automated deployment via `.github/workflows/ci-cd.yml`:

- **Development**: Auto-deploy on push to `develop` branch
- **Staging**: Auto-deploy on push to `main` branch
- **Production**: Manual trigger via workflow_dispatch

```bash
# Trigger production deployment manually
1. Go to GitHub → Actions
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select environment: production
5. Click "Run workflow"
```

## Step 4: Verify Deployment

### 4.1 Check Deployment Status

```bash
# List deployments
vercel ls

# Get deployment details
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]
```

### 4.2 Run Smoke Tests

```bash
# Test health endpoint
curl https://your-deployment.vercel.app/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}

# Test OAuth endpoints
curl https://your-deployment.vercel.app/.well-known/oauth-authorization-server

# Expected response:
{
  "issuer": "https://your-deployment.vercel.app",
  "authorization_endpoint": "https://your-deployment.vercel.app/oauth/authorize",
  "token_endpoint": "https://your-deployment.vercel.app/oauth/token",
  ...
}
```

### 4.3 Run Full Test Suite

```bash
# Set gateway URL
export GATEWAY_URL=https://your-deployment.vercel.app
export API_KEY=your-api-key

# Run deployment tests
npm run test:deployment

# Run smoke tests
npm run test:smoke
```

## Step 5: Configure Custom Domain

### 5.1 Add Domain via Vercel Dashboard

```
1. Go to Vercel dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., gateway.your-domain.com)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (typically 24-48 hours)
```

### 5.2 Update Environment Variables

```bash
# Update JWT_ISSUER and CORS_ORIGINS
vercel env add JWT_ISSUER production
# Enter: https://gateway.your-domain.com

vercel env add CORS_ORIGINS production
# Enter: https://app.your-domain.com,https://dashboard.your-domain.com
```

### 5.3 Redeploy with New Configuration

```bash
vercel --prod
```

## Step 6: Monitoring and Maintenance

### 6.1 Enable Vercel Analytics

```
1. Go to Vercel dashboard → Project → Analytics
2. Enable Web Analytics
3. Configure custom events (optional)
```

### 6.2 Set Up Alerts

```
1. Go to Vercel dashboard → Project → Settings → Notifications
2. Configure deployment notifications
3. Set up error alerts
```

### 6.3 Monitor Database

```bash
# Neon dashboard: https://console.neon.tech
1. Check connection count
2. Monitor query performance
3. Review storage usage
4. Set up usage alerts
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
node -e "const {neon} = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT NOW()\`.then(console.log);"

# Common issues:
- Invalid connection string → Check DATABASE_URL format
- SSL required → Ensure ?sslmode=require in connection string
- Connection timeout → Check Neon project status and network
```

### Deployment Failures

```bash
# Check build logs
vercel logs [deployment-url]

# Common issues:
- Missing environment variables → Add via vercel env
- Build errors → Run npm run build locally
- Runtime errors → Check function logs in Vercel dashboard
```

### Performance Issues

```bash
# Enable edge caching
# Add to vercel.json:
{
  "headers": [{
    "source": "/api/(.*)",
    "headers": [{
      "key": "Cache-Control",
      "value": "s-maxage=60, stale-while-revalidate"
    }]
  }]
}

# Monitor response times
# Vercel dashboard → Analytics → Performance
```

## Security Best Practices

### 1. Secret Management

```bash
# Rotate secrets regularly
vercel env rm JWT_SECRET production
vercel env add JWT_SECRET production

# Use different secrets for each environment
# Never commit secrets to version control
# Use .env.example with placeholder values
```

### 2. Database Security

```
1. Enable Neon IP allowlist (if needed)
2. Use connection pooling
3. Enable query logging for auditing
4. Regular database backups (Neon automatic)
5. Implement row-level security
```

### 3. Network Security

```
1. Enable HTTPS only (automatic with Vercel)
2. Configure CORS properly
3. Set security headers (in vercel.json)
4. Rate limiting (via Vercel KV or Upstash)
5. DDoS protection (Vercel automatic)
```

## Performance Optimization

### 1. Edge Functions

```bash
# Configure edge runtime in vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0",
      "maxDuration": 10
    }
  }
}
```

### 2. Caching Strategy

```bash
# Add caching headers
# See vercel.json for cache configuration
# Use Vercel KV for distributed cache
```

### 3. Database Optimization

```bash
# Enable connection pooling
# Neon automatically pools connections

# Use prepared statements
# Reduce query payload size
# Implement database indexes (already in schema)
```

## Next Steps

1. ✅ Set up monitoring dashboard
2. ✅ Configure alerts and notifications
3. ✅ Implement backup strategy
4. ✅ Set up CI/CD pipeline
5. ✅ Configure custom domain
6. ✅ Enable analytics
7. ✅ Set up staging environment
8. ✅ Document API endpoints
9. ✅ Create runbooks for common issues
10. ✅ Train team on deployment process

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Neon Documentation**: https://neon.tech/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Project Issues**: https://github.com/your-org/oauth-mcp-gateway/issues
