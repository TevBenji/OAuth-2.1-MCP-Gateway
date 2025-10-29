# Onboarding Integration Setup Guide

This guide walks you through setting up and testing the integrated onboarding system.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Convex project initialized
- Clerk authentication configured
- Local development environment set up

## Step 1: Deploy Convex Schema Changes

The schema has been updated to include onboarding tracking fields. Deploy these changes:

```bash
cd frontend
npx convex deploy
```

This will:
1. Update the users table schema with `onboardingCompleted` and `onboardingCompletedAt` fields
2. Create Convex functions: `getOnboardingStatus` and `completeOnboarding`

**Expected Output:**
```
✓ Schema deployed successfully
✓ Functions registered
```

## Step 2: Verify Environment Variables

Ensure your `.env.local` has these Convex variables:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Step 3: Start Development Server

```bash
npm run dev
```

The frontend should start at `http://localhost:3000`

## Step 4: Test the Integration

### Test 1: New User Flow (Onboarding Not Completed)

1. **Sign up** a new test user:
   - Navigate to `/sign-up`
   - Create account with test email
   - You'll be redirected to dashboard

2. **Verify onboarding banner appears**:
   - Banner should be visible at top of dashboard
   - Shows "Welcome to OAuth 2.1 MCP Gateway!"
   - Has green background with icon
   - Contains "Start Setup Guide" button

3. **Test banner dismissal**:
   - Click X button on banner
   - Banner should disappear
   - Page should not reload

4. **Test onboarding navigation**:
   - Scroll down or look for "Onboarding Guide" in sidebar (under "Getting Started" section)
   - Click "Onboarding Guide"
   - Should navigate to `/onboarding` page

### Test 2: Onboarding Wizard

1. **Access onboarding page**:
   - Navigate to `/onboarding`
   - Should load without authentication issues
   - Progress bar should show 5 steps

2. **Complete wizard**:
   - Step 1: Click "Next" on Welcome
   - Step 2: Enter client information, click "Next"
   - Step 3: Review MCP servers, click "Skip" or "Next"
   - Step 4: Click "Test & Next"
   - Step 5: Click "Complete Setup"

3. **Verify completion**:
   - Should redirect to dashboard
   - Banner should NOT appear anymore
   - Check browser console: no errors
   - Check Convex dashboard: user record should have `onboardingCompleted: true`

### Test 3: Returning User Flow

1. **Log out**:
   - Use user menu to sign out

2. **Log in** again:
   - Sign in with same test user
   - Dashboard should load

3. **Verify no banner**:
   - Onboarding banner should NOT appear
   - User has already completed setup

### Test 4: Sidebar Navigation

1. **Check sidebar**:
   - "Getting Started" section should be visible
   - "Onboarding Guide" link should be present
   - Should be expandable/collapsible

2. **Verify link works**:
   - Click "Onboarding Guide"
   - Should navigate to `/onboarding`

### Test 5: Unauthenticated Access

1. **Open onboarding in incognito**:
   - Open `/onboarding` in new incognito window
   - Should NOT be accessible
   - Should redirect to `/sign-in`
   - Loading state should show briefly

## Step 6: Database Verification

Check Convex dashboard to verify data:

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to "users" table
4. Find your test user
5. Verify:
   - `onboardingCompleted: true` (after completing wizard)
   - `onboardingCompletedAt: <timestamp>` (Unix timestamp when completed)

## Step 7: Console Verification

Open browser DevTools console and look for:

1. **No errors** during navigation
2. **Convex logs** showing successful queries/mutations:
   ```
   [Convex] getOnboardingStatus: {completed: false, completedAt: null}
   [Convex] completeOnboarding: {completed: true, completedAt: 1234567890}
   ```

## Troubleshooting

### Issue: Onboarding banner doesn't appear

**Diagnosis**:
1. Check if user is authenticated: Look for user info in console
2. Verify Convex query is running: Check Convex dashboard logs
3. Check browser console for errors

**Solution**:
```javascript
// In browser console:
// 1. Verify user is authenticated
console.log("User:", user);

// 2. Check onboarding status directly
// Add this to dashboard component temporarily for debugging
const status = useQuery(api.users.getOnboardingStatus, {clerkId: user.id});
console.log("Onboarding Status:", status);
```

### Issue: Banner shows but dismiss doesn't work

**Solution**:
- Check `setShowOnboardingPrompt` state is working
- Verify onClick handler: `onClick={() => setShowOnboardingPrompt(false)}`
- Clear React DevTools cache

### Issue: Completion not persisting

**Diagnosis**:
1. Check Convex dashboard for mutation errors
2. Verify user ID is being passed correctly
3. Check network tab in DevTools

**Solution**:
```bash
# Regenerate Convex types
npx convex dev

# Then test again
npm run dev
```

### Issue: Navigation loops or redirects

**Solution**:
1. Clear browser cache: `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Close and reopen browser
3. Check for middleware intercepting routes in `next.config.js`

### Issue: Tailwind styles not applying

**Solution**:
1. Verify class names are exactly correct (no typos)
2. Check `tailwind.config.js` includes `src/` directory
3. Restart dev server: `Ctrl+C` then `npm run dev`

## Performance Notes

- Onboarding status is queried once per page load
- Banner dismissal is local state (not persisted)
- Convex queries are cached by default
- No additional API calls after completion

## Security Checklist

- [ ] Onboarding route requires authentication
- [ ] User ID from Clerk is used for all database operations
- [ ] Mutations can only be called by authenticated users
- [ ] No sensitive data exposed in URLs
- [ ] Convex rules validate all operations

## Next Steps

After successful setup:

1. **Run full test suite** if available
2. **Test on different devices** (mobile, tablet, desktop)
3. **Test with different browsers** (Chrome, Firefox, Safari, Edge)
4. **Monitor Convex usage** in dashboard
5. **Set up analytics** to track completion rates
6. **Create backup** of current deployment

## Testing Checklist

Complete checklist for comprehensive testing:

- [ ] New user sees onboarding banner
- [ ] Banner dismissible with X button
- [ ] "Start Setup Guide" button works
- [ ] Navigation to `/onboarding` successful
- [ ] All 5 wizard steps display correctly
- [ ] Wizard completion updates database
- [ ] User redirected to dashboard on completion
- [ ] Banner hidden after completion
- [ ] Returning user doesn't see banner
- [ ] Sidebar "Onboarding Guide" link always visible
- [ ] Sidebar link navigates to `/onboarding`
- [ ] Unauthenticated access redirects to `/sign-in`
- [ ] Loading state shows during auth check
- [ ] No console errors
- [ ] Responsive design works on all devices
- [ ] Convex database reflects changes
- [ ] Performance acceptable (page load <2s)

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No console warnings or errors
- [ ] Convex schema deployed
- [ ] Environment variables configured
- [ ] Clerk authentication working
- [ ] Database backups created
- [ ] Monitoring/logging configured
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] User documentation created

## Support & Debugging

### Enable Debug Logging

Add to your component temporarily:

```typescript
// In dashboard or onboarding pages
useEffect(() => {
  console.log('Onboarding Status:', {
    isCompleted,
    completedAt,
    isLoading,
  });
}, [isCompleted, completedAt, isLoading]);
```

### Check Convex Logs

1. Open [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to "Logs" tab
4. Filter by function name: `getOnboardingStatus`, `completeOnboarding`
5. View execution details and errors

### Clear Convex Cache

If seeing stale data:

```bash
# Stop dev server
# Delete .convex folder
rm -rf .convex

# Restart
npx convex dev
npm run dev
```

## Related Files Modified

- `frontend/convex/schema.ts` - Added fields
- `frontend/convex/users.ts` - Added functions
- `frontend/src/hooks/useOnboarding.ts` - Created
- `frontend/src/app/onboarding/page.tsx` - Updated
- `frontend/src/app/onboarding/layout.tsx` - Created
- `frontend/src/app/dashboard/page.tsx` - Updated
- `frontend/src/app/dashboard/layout.tsx` - Updated
- `frontend/src/components/onboarding/OnboardingWizard.tsx` - Updated

## Quick Reference Commands

```bash
# Start development
npm run dev

# Deploy Convex
npx convex deploy

# Build for production
npm run build

# Run linter
npm run lint

# Watch Convex in dev
npx convex dev

# Clear cache and restart
rm -rf .convex .next node_modules/.cache
npm run dev
```

## Useful Links

- [Convex Dashboard](https://dashboard.convex.dev)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)

---

**Last Updated**: October 29, 2024
**Status**: Ready for Testing
