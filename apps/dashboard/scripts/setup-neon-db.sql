-- ============================================
-- Neon Database Setup for OAuth 2.1 MCP Gateway
-- ============================================
-- Run this script in your Neon SQL Editor:
-- https://console.neon.tech → Your Project → SQL Editor

-- Enable Row-Level Security (RLS) for multi-tenant isolation
-- This is required for Neon Auth to work properly

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, UPDATE, INSERT, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE, INSERT, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- Grant read-only access to anonymous users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anonymous;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated, anonymous;

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
-- After running this, go to Neon Console → Data API → Refresh schema cache

-- ============================================
-- VERIFY SETUP
-- ============================================
-- Run these queries to verify permissions:

-- Check table permissions
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY grantee, table_name;

-- Check role memberships
SELECT
  r.rolname,
  ARRAY_AGG(m.rolname) as member_of
FROM pg_roles r
LEFT JOIN pg_auth_members am ON r.oid = am.member
LEFT JOIN pg_roles m ON am.roleid = m.oid
WHERE r.rolname IN ('authenticated', 'anonymous', 'postgres')
GROUP BY r.rolname;

-- ============================================
-- NOTES
-- ============================================
-- 1. This script sets up permissions for Neon Auth integration
-- 2. Row-Level Security policies should be added to protect data
-- 3. Run 'pnpm prisma db push' from frontend directory to create tables
-- 4. After creating tables, refresh schema cache in Neon Console
-- 5. Test the connection with 'pnpm prisma studio'

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. ✅ Run this SQL script in Neon SQL Editor
-- 2. ✅ Go to frontend directory: cd frontend
-- 3. ✅ Install dependencies: pnpm install
-- 4. ✅ Generate Prisma client: pnpm prisma generate
-- 5. ✅ Push database schema: pnpm prisma db push
-- 6. ✅ Refresh schema cache in Neon Console → Data API
-- 7. ✅ Start development server: pnpm dev
-- 8. ✅ Visit http://localhost:3000
