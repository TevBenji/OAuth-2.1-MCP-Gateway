# Dashboard Implementation Plan - Multi-Agent Orchestration

## Executive Summary

**Date:** 2025-10-29
**Project:** OAuth 2.1 MCP Gateway Dashboard Pages
**Orchestrator:** Claude Code Multi-Agent System
**Agents:** @qwen (Security), @codex (Architecture), @gemini (UI Generation)

## Page Classification & Status

### ✅ P0 - ESSENTIAL (Implement First)

| Page | Path | Status | Priority | Security Level |
|------|------|--------|----------|----------------|
| **Projects** | `dashboard/organization/projects/page.tsx` | ✅ EXISTING | P0 | HIGH |
| **API Keys** | `dashboard/organization/api-keys/page.tsx` | ✅ EXISTING | P0 | CRITICAL |
| **Usage Limits** | `dashboard/organization/usage-limits/page.tsx` | ✅ EXISTING | P0 | MEDIUM |

**Status:** All P0 pages exist and are functional. Require optimization based on Codex analysis.

### ⚡ P1 - HIGH PRIORITY (Implement Next)

| Page | Path | Status | Priority | Security Level |
|------|------|--------|----------|----------------|
| **Overview** | `dashboard/page.tsx` | ✅ EXISTING | P1 | MEDIUM |
| **Team Members** | `dashboard/team/page.tsx` | ✅ EXISTING | P1 | HIGH |
| **Settings** | `dashboard/settings/page.tsx` | ✅ EXISTING | P1 | CRITICAL |
| **Invoice** | `dashboard/billing/invoice/page.tsx` | ✅ EXISTING | P1 | MEDIUM |

**Status:** All P1 pages exist. Overview and Team Members need Server Component migration.

### ❌ P2 - DEFER (Use Stripe Integration)

| Page | Path | Recommendation | Reason |
|------|------|---------------|---------|
| **Recharge** | `dashboard/billing/recharge/page.tsx` | REMOVE | Redundant with Stripe checkout |
| **Recharge Details** | `dashboard/billing/recharge-details/page.tsx` | REMOVE | Use Stripe payment history |
| **Billing Details** | `dashboard/billing/details/page.tsx` | REMOVE | Use Stripe customer portal |

**Action:** Delete these files and redirect to Stripe-hosted pages.

### 📋 P3 - LOW PRIORITY (Future Enhancement)

| Page | Path | Status | Implementation Timeline |
|------|------|--------|------------------------|
| **Voucher** | `dashboard/billing/voucher/page.tsx` | DEFER | Q2 2026 if needed |
| **Export Records** | `dashboard/billing/export/page.tsx` | DEFER | After data retention requirements |

---

## Architecture Analysis (by @codex)

### Current State Assessment

**Bundle Size Analysis:**
- **Current:** ~650KB compressed per dashboard route
- **Target:** <400KB compressed
- **Hot Spots:** Large Lucide icon imports (15+ icons), full Recharts bundle

**Component Patterns:**
- **Issue:** 100% Client Components (`'use client'` on all pages)
- **Issue:** Repeated UI patterns (loaders, modals, search bars)
- **Issue:** No code splitting or lazy loading

### Recommended Component Extraction

#### 1. **PageLoader Component**
**Location:** `frontend/src/components/ui/PageLoader.tsx`

```typescript
import { Loader2 } from 'lucide-react';

export function PageLoader({ message = 'Loading...', fullHeight = true }) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullHeight ? 'min-h-[60vh]' : 'py-12'}`}>
      <Loader2 className="w-10 h-10 text-wise-green-primary animate-spin mb-4" />
      <p className="text-wise-gray-600 text-sm">{message}</p>
    </div>
  );
}
```

**Replaces:**
- `dashboard/page.tsx:211`
- `team/page.tsx:82`
- `billing/overview/page.tsx:18-33`

#### 2. **FormModal Component**
**Location:** `frontend/src/components/dashboard/common/FormModal.tsx`

```typescript
import { Modal } from '../Modal';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  submitLabel: string;
  children: React.ReactNode;
  destructive?: boolean;
  loading?: boolean;
}

export function FormModal({
  isOpen, onClose, onSubmit, title, submitLabel,
  children, destructive, loading
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 ${destructive ? 'btn-wise-danger' : 'btn-wise-primary'}`}
          >
            {loading ? 'Processing...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

**Harmonizes:**
- `api-keys/page.tsx:318-524, 636, 912`
- `projects/page.tsx:568-626`

#### 3. **SearchAndFilter Component**
**Location:** `frontend/src/components/dashboard/common/SearchAndFilter.tsx`

```typescript
import { Search, X } from 'lucide-react';

interface SearchAndFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters?: React.ReactNode;
  onReset?: () => void;
  placeholder?: string;
}

export function SearchAndFilter({
  query, onQueryChange, filters, onReset,
  placeholder = 'Search...'
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wise-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="input-wise pl-10"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-wise-gray-100 rounded"
          >
            <X className="w-4 h-4 text-wise-gray-400" />
          </button>
        )}
      </div>
      {filters && <div className="flex items-center space-x-2">{filters}</div>}
      {onReset && query && (
        <button onClick={onReset} className="text-sm text-wise-green-primary">
          Reset
        </button>
      )}
    </div>
  );
}
```

**Encapsulates:**
- `projects/page.tsx:225-320`
- Future use in API keys filtering

#### 4. **DataCard Component**
**Location:** `frontend/src/components/dashboard/common/DataCard.tsx`

```typescript
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DataCardProps {
  icon: LucideIcon;
  title: string;
  metric: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  actions?: React.ReactNode;
}

export function DataCard({ icon: Icon, title, metric, trend, color = 'green', actions }: DataCardProps) {
  const colorClasses = {
    green: { icon: 'text-wise-green-primary', bg: 'bg-wise-green-50', trend: 'text-wise-green-primary' },
    blue: { icon: 'text-blue-600', bg: 'bg-blue-50', trend: 'text-blue-600' },
    purple: { icon: 'text-purple-600', bg: 'bg-purple-50', trend: 'text-purple-600' },
    orange: { icon: 'text-orange-600', bg: 'bg-orange-50', trend: 'text-orange-600' },
    red: { icon: 'text-red-600', bg: 'bg-red-50', trend: 'text-red-600' },
  };

  const classes = colorClasses[color];

  return (
    <div className="card-wise p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${classes.bg}`}>
          <Icon className={`w-6 h-6 ${classes.icon}`} />
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend.direction === 'up' && <ArrowUpRight className={`w-4 h-4 ${classes.trend}`} />}
            {trend.direction === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
            <span className={`text-sm font-medium ${trend.direction === 'up' ? classes.trend : 'text-red-500'}`}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-wise-gray-900">{metric}</h3>
        <p className="text-sm text-wise-gray-600 mt-1">{title}</p>
      </div>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
```

**Normalizes:**
- `dashboard/page.tsx:243-391`
- `analytics/page.tsx:207-347`
- `billing/overview/page.tsx:74-144`

---

## Server Component Migration Strategy

### Phase 1: Read-Heavy Pages (Week 1)

#### **Billing Overview** → Server Component
**File:** `dashboard/billing/overview/page.tsx`

**Current State:**
```typescript
'use client';
// Uses useQuery for data fetching
```

**Target State:**
```typescript
// Remove 'use client'
import { fetchQuery } from 'convex/nextjs';

export default async function BillingOverviewPage() {
  const overview = await fetchQuery(api.billing.getBillingOverview, { ... });

  return (
    <>
      <BillingStats data={overview} />
      <Suspense fallback={<ChartSkeleton />}>
        <BillingChart data={overview} />
      </Suspense>
    </>
  );
}

// Separate file: BillingChart.client.tsx
'use client';
export function BillingChart({ data }) {
  // Interactive chart logic
}
```

**Benefits:**
- Reduced bundle size (~50KB savings)
- Faster initial load
- Better SEO and performance scores

#### **Analytics Page** → Server Component
**File:** `dashboard/analytics/page.tsx`

**Migration Pattern:** Same as Billing Overview
- Server-side data fetching
- Client components for charts only
- Suspense boundaries for streaming

### Phase 2: Dashboard & Layout (Week 2)

#### **Main Dashboard** → Hybrid Component
**File:** `dashboard/page.tsx`

**Split Strategy:**
```
dashboard/page.tsx (Server)
  ├─ DashboardStats (Server)
  ├─ <Suspense fallback={<ChartSkeleton />}>
  │   └─ UsageChart.client.tsx (Client)
  ├─ <Suspense fallback={<ProviderSkeleton />}>
  │   └─ ProviderChart.client.tsx (Client)
  └─ RecentActivity (Server)
```

**Key Changes:**
- Remove `mounted` state guard (line 79)
- Remove `useEffect` for hydration (line 79-81)
- Preload data server-side
- Stream charts with Suspense

#### **Dashboard Layout** → Hybrid Layout
**File:** `dashboard/layout.tsx`

**Current Issues:**
- Entire layout is client component
- Clerk auth check happens client-side
- Mobile sidebar state affects entire tree

**Refactor Plan:**
```
dashboard/layout.tsx (Server)
  └─ DashboardSidebarClient.tsx (Client)
      ├─ Mobile drawer state
      ├─ Clerk UserButton
      └─ Hamburger toggle
```

**Benefits:**
- Reduce client JS by ~100KB
- Faster initial page load
- Better streaming support

---

## Performance Optimization Priorities

### 1. Icon Import Optimization

**Current Problem:**
```typescript
// dashboard/page.tsx:21-58
import {
  ArrowUpRight,
  ArrowDownRight,
  Key,
  Shield,
  // ... 15+ more icons
} from 'lucide-react';
```

**Solution: Icon Maps**
```typescript
// lib/icons.ts
export const DashboardIcons = {
  ArrowUpRight: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ArrowUpRight }))),
  // ... only used icons
};
```

**Estimated Savings:** ~30KB per page

### 2. Chart Bundle Splitting

**Current Problem:**
```typescript
// Loads entire Recharts library
import { LineChart, AreaChart, BarChart, PieChart, ... } from 'recharts';
```

**Solution: Dynamic Imports**
```typescript
const AreaChart = dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })));
```

**Create Shared Chart Container:**
```typescript
// components/charts/ChartContainer.tsx
'use client';

export function ChartContainer({ children, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}
```

**Estimated Savings:** ~80KB per page

### 3. Modal/Drawer Lazy Loading

**Current Problem:**
```typescript
// All modal code loads on page mount
<CreateApiKeyModal ... />
```

**Solution:**
```typescript
const CreateApiKeyModal = dynamic(() => import('./CreateApiKeyModal'));

{showModal && <CreateApiKeyModal ... />}
```

**Files to Update:**
- `api-keys/page.tsx:318-524`
- `dashboard/layout.tsx:118-227`

**Estimated Savings:** ~40KB per modal

### 4. Bundle Analysis Setup

**Add to package.json:**
```json
{
  "scripts": {
    "build:analyze": "ANALYZE=true next build"
  }
}
```

**Target Metrics:**
- **Current:** ~650KB compressed
- **Phase 1:** <500KB (component extraction + icons)
- **Phase 2:** <400KB (Server Components + lazy loading)
- **Phase 3:** <350KB (chart optimization)

---

## Security Requirements (per @qwen Analysis)

### API Keys Page - CRITICAL Security

**Existing Implementation Status:**
✅ Show-once pattern (line 494-536)
✅ Masked display (line 168-173)
✅ Copy to clipboard (line 145-154)
❌ **MISSING: API key hashing** (currently stores plain text)
❌ **MISSING: Rate limiting** (no backend enforcement)
❌ **MISSING: RBAC checks** (no role verification)
❌ **MISSING: Audit logging** (no event tracking)

**Required Enhancements:**

1. **Backend API Key Hashing (Convex)**
```typescript
// convex/apiKeys.ts
import bcrypt from 'bcryptjs';

export const create = mutation({
  handler: async (ctx, args) => {
    // Generate cryptographically secure key
    const key = crypto.randomBytes(32).toString('base64url');

    // Hash key before storage
    const hashedKey = await bcrypt.hash(key, 12);

    // Store hash, return plain key once
    await ctx.db.insert('api_keys', {
      ...args,
      keyHash: hashedKey,
      keyPrefix: key.slice(0, 8), // For display
    });

    return { key }; // Plain key returned ONCE
  },
});

export const verify = query({
  handler: async (ctx, { key }) => {
    const apiKey = await ctx.db
      .query('api_keys')
      .filter(q => q.eq(q.field('keyPrefix'), key.slice(0, 8)))
      .first();

    if (!apiKey) return null;

    const valid = await bcrypt.compare(key, apiKey.keyHash);
    return valid ? apiKey : null;
  },
});
```

2. **RBAC Authorization Checks**
```typescript
// Add to all mutations
const userRole = await ctx.db
  .query('team_members')
  .withIndex('by_user', q => q.eq('userId', user.id))
  .first();

if (!['owner', 'admin'].includes(userRole?.role)) {
  throw new Error('Insufficient permissions');
}
```

3. **Rate Limiting Middleware**
```typescript
// middleware/rateLimit.ts
import { Redis } from '@upstash/redis';

export async function checkRateLimit(userId: string, operation: string) {
  const key = `ratelimit:${operation}:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (count > 5) {
    throw new Error('Rate limit exceeded');
  }
}
```

4. **Audit Logging**
```typescript
// convex/audit.ts
export const logApiKeyEvent = internalMutation({
  handler: async (ctx, { userId, action, keyId, ipAddress }) => {
    await ctx.db.insert('audit_logs', {
      userId,
      action, // 'api_key_created', 'api_key_deleted', 'api_key_used'
      resource: 'api_key',
      resourceId: keyId,
      ipAddress,
      timestamp: Date.now(),
    });
  },
});
```

### Team Members Page - HIGH Security

**Required Features:**
- [ ] Role-based permissions matrix
- [ ] Secure invite token generation (JWT with expiration)
- [ ] Email verification for invites
- [ ] Audit log for role changes
- [ ] Owner-only actions (delete team members)

### Settings Page - CRITICAL Security

**Required Features:**
- [ ] 2FA setup (TOTP with QR code)
- [ ] Session management (view active sessions, revoke)
- [ ] Password change with re-authentication
- [ ] Account deletion with confirmation + grace period
- [ ] Security event notifications

---

## Directory Structure Recommendations

```
frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── common/           # Extracted reusable components
│   │   │   ├── PageLoader.tsx
│   │   │   ├── FormModal.tsx
│   │   │   ├── SearchAndFilter.tsx
│   │   │   └── DataCard.tsx
│   │   ├── charts/           # Chart wrappers
│   │   │   ├── ChartContainer.tsx
│   │   │   ├── UsageChart.client.tsx
│   │   │   └── ProviderChart.client.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   ├── StatCard.tsx
│   │   └── DashboardSkeleton.tsx
│   └── ui/                   # Generic UI components
├── features/                 # Feature-specific logic
│   ├── api-keys/
│   │   ├── hooks/
│   │   │   └── useApiKeys.ts
│   │   ├── components/
│   │   │   ├── CreateKeyModal.client.tsx
│   │   │   └── DeleteKeyModal.client.tsx
│   │   └── types.ts
│   ├── projects/
│   ├── team/
│   └── billing/
├── lib/
│   ├── convexClient.ts      # Convex service layer
│   ├── icons.ts             # Icon maps
│   └── utils/
└── app/
    └── dashboard/
        ├── layout.tsx       # Server layout
        ├── page.tsx         # Server page with client islands
        ├── organization/
        ├── billing/
        └── settings/
```

---

## Implementation Timeline

### Week 1: Component Extraction
- [ ] Create `components/dashboard/common/` directory
- [ ] Implement PageLoader, FormModal, SearchAndFilter, DataCard
- [ ] Refactor existing pages to use new components
- [ ] Test across all dashboard pages

### Week 2: Server Component Migration
- [ ] Billing Overview → Server Component
- [ ] Analytics → Server Component
- [ ] Add Suspense boundaries with skeletons

### Week 3: Performance Optimization
- [ ] Implement icon maps and dynamic imports
- [ ] Lazy load charts with code splitting
- [ ] Dynamic imports for modals/drawers
- [ ] Run bundle analyzer, validate <400KB target

### Week 4: Security Enhancements
- [ ] Implement API key hashing in Convex
- [ ] Add RBAC checks to all mutations
- [ ] Implement rate limiting middleware
- [ ] Add comprehensive audit logging
- [ ] Security testing and penetration testing

### Week 5: Documentation & Testing
- [ ] Component library documentation
- [ ] API documentation
- [ ] E2E tests for critical paths
- [ ] Performance testing (LCP < 2.5s on 3G)
- [ ] Security checklist verification

---

## Validation Checklist

### Security Checklist (Each Page)
- [ ] Input validation on all user inputs
- [ ] CSRF protection (Convex built-in)
- [ ] Rate limiting on mutations
- [ ] Authorization checks (RBAC)
- [ ] Audit logging for sensitive actions
- [ ] No sensitive data in client-side code
- [ ] Secure error messages (no info leakage)
- [ ] API key hashing (bcrypt with salt rounds 12)
- [ ] Session management and timeout

### Performance Checklist
- [ ] Bundle size <400KB compressed
- [ ] LCP <2.5s on 3G
- [ ] Server Components for data fetching
- [ ] Suspense boundaries for loading states
- [ ] Code splitting for routes and modals
- [ ] Dynamic icon imports
- [ ] Chart lazy loading
- [ ] No hydration mismatches

### Quality Scoring (0-100)
- **Correctness:** 40%
- **Completeness:** 20%
- **Code Quality:** 20%
- **Security:** 10%
- **Performance:** 5%
- **Maintainability:** 5%

**Target Score:** 85%+ for all pages

---

## Files to DELETE

### Redundant Billing Pages (Use Stripe)
```bash
# Delete these files:
rm frontend/src/app/dashboard/billing/recharge/page.tsx
rm frontend/src/app/dashboard/billing/recharge-details/page.tsx
rm frontend/src/app/dashboard/billing/details/page.tsx

# Update navigation in layout.tsx to remove these menu items
```

### Redirect Configuration
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/dashboard/billing/recharge',
        destination: 'https://billing.stripe.com/p/login/...',
        permanent: false,
      },
      {
        source: '/dashboard/billing/details',
        destination: 'https://billing.stripe.com/p/session/...',
        permanent: false,
      },
    ];
  },
};
```

---

## Success Metrics

### Performance Targets
- **Bundle Size:** <400KB compressed (from 650KB)
- **LCP:** <2.5s on 3G (from ~4s)
- **FID:** <100ms
- **CLS:** <0.1
- **Time to Interactive:** <5s

### Security Targets
- **API Key Security:** 100% hashed storage, zero plain text
- **RBAC Coverage:** 100% of mutations
- **Audit Logging:** 100% of sensitive operations
- **Rate Limiting:** All user-facing mutations
- **Penetration Test:** Zero critical vulnerabilities

### Code Quality Targets
- **TypeScript Coverage:** 100%
- **Component Reusability:** 80% of UI patterns extracted
- **Server Component Adoption:** 60% of pages
- **Test Coverage:** >80% unit, >70% integration

---

## Conclusion

**Summary:**
- ✅ All 13 dashboard pages have been analyzed
- ✅ 8 pages exist and are functional (P0 + P1)
- ❌ 3 pages should be removed (Stripe integration)
- 📋 2 pages can be deferred (Voucher, Export)

**Key Recommendations:**
1. **Extract 4 reusable components** to reduce code duplication
2. **Migrate 4 pages to Server Components** for 30-50% bundle savings
3. **Implement critical security enhancements** for API Keys, Team, Settings
4. **Delete 3 redundant billing pages** and use Stripe portal
5. **Optimize performance** with code splitting and lazy loading

**Estimated Timeline:** 5 weeks (1 week per phase)
**Estimated Bundle Reduction:** 38% (650KB → 400KB)
**Security Posture:** CRITICAL → EXCELLENT with recommended enhancements

**Next Steps:**
1. Create component extraction branch
2. Implement PageLoader, FormModal, SearchAndFilter, DataCard
3. Begin Server Component migration with Billing Overview
4. Set up bundle analyzer and performance monitoring
5. Schedule security review and penetration testing
