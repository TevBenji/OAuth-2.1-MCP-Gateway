# PowerShell Database Setup Script for Windows
# This script sets up the Neon database with proper permissions

Write-Host "🚀 Setting up Neon Database..." -ForegroundColor Green
Write-Host ""

# Load .env.local file
$envFile = Join-Path $PSScriptRoot "..\. env.local"
if (Test-Path $envFile) {
    Write-Host "📁 Loading environment variables from .env.local..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Get DATABASE_URL
$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host "Please make sure DATABASE_URL is set in frontend/.env.local" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Database URL loaded" -ForegroundColor Green
Write-Host ""

# Check if running from frontend directory
$currentDir = Get-Location
if ($currentDir.Path -notlike "*frontend*") {
    Write-Host "⚠️  Warning: This script should be run from the frontend directory" -ForegroundColor Yellow
    Write-Host "Changing directory to frontend..." -ForegroundColor Yellow
    Set-Location -Path (Join-Path $PSScriptRoot "..")
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Cyan
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 2: Generating Prisma Client..." -ForegroundColor Cyan
pnpm prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Step 3: Pushing database schema to Neon..." -ForegroundColor Cyan
pnpm prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push database schema" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL and try again" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database schema pushed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: pnpm dev" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Sign up and start using the app!" -ForegroundColor White
Write-Host ""
Write-Host "Optional: Run 'pnpm prisma studio' to view your database" -ForegroundColor Yellow
