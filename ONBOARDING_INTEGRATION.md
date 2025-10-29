# Onboarding Wizard Integration Guide

This document describes the complete integration of the onboarding wizard into the OAuth 2.1 MCP Gateway dashboard.

## Overview

The onboarding system guides new users through a 5-step setup process:
1. Welcome - Introduction and feature overview
2. Client Setup - Register their first OAuth application
3. MCP Servers - Configure MCP servers (optional)
4. Test Integration - Get credentials and test the setup
5. Complete - Confirmation and next steps

## Architecture

### Components

#### Frontend Components (`frontend/src/components/onboarding/`)
- **OnboardingWizard.tsx** - Main orchestrator component (updated)
  - Manages step navigation and data flow
  - Handles completion marking via Convex
  - Redirects to dashboard after completion

- **ProgressBar.tsx** - Visual progress indicator
- **WelcomeStep.tsx** - Introduction screen
- **ClientRegistrationStep.tsx** - OAuth client registration form
- **MCPServerStep.tsx** - MCP server configuration
- **TestIntegrationStep.tsx** - Integration testing interface
- **CompletionStep.tsx** - Success confirmation

#### Pages
- **frontend/src/app/onboarding/page.tsx** (updated)
  - Protects route with authentication
  - Shows loading state during auth check
  - Renders OnboardingWizard component

- **frontend/src/app/onboarding/layout.tsx** (created)
  - Provides consistent layout styling
  - Sets metadata

#### Hooks
- **frontend/src/hooks/useOnboarding.ts** (created)
  - Custom hook for onboarding status management
  - Provides: `isCompleted`, `completedAt`, `isLoading`, `completeOnboarding()`
  - Uses Convex queries and mutations

### Database

#### Schema Updates (`frontend/convex/schema.ts`)
Added to users table:
```typescript
onboardingCompleted: v.optional(v.boolean()),
onboardingCompletedAt: v.optional(v.number()),
```

#### Convex Functions (`frontend/convex/users.ts`)

**getOnboardingStatus(clerkId: string)**
- Query to check if user has completed onboarding
- Returns: `{ completed: boolean, completedAt: number | null }`

**completeOnboarding(clerkId: string)**
- Mutation to mark onboarding as complete
- Sets `onboardingCompleted = true` and records timestamp
- Returns: `{ completed: true, completedAt: number }`

### Dashboard Integration

#### Dashboard Page Updates (`frontend/src/app/dashboard/page.tsx`)
- **useOnboarding hook** imported and used
- **Onboarding prompt banner** displayed for new users
  - Shows only if onboarding not completed
  - Dismissible (hidden when user clicks X)
  - Prominent "Start Setup Guide" button linking to `/onboarding`
  - Green gradient background with icon

#### Navigation Updates (`frontend/src/app/dashboard/layout.tsx`)
- **New "Getting Started" section** added to sidebar
  - Contains "Onboarding Guide" link
  - Always visible in main navigation
  - Expanded by default
  - Easily accessible for users to re-run onboarding

## User Flows

### Flow 1: New User (First Time)
1. User signs up via `/sign-up`
2. Redirected to dashboard
3. Onboarding status checked via `useOnboarding` hook
4. Banner displayed prompting to start onboarding
5. User clicks "Start Setup Guide"
6. Navigates to `/onboarding`
7. Completes 5-step wizard
8. On completion, `completeOnboarding()` mutation is called
9. User redirected to `/dashboard`
10. Banner no longer shows (onboarding marked complete)

### Flow 2: Returning User
1. User logs in
2. Navigates to dashboard
3. Onboarding status checked
4. Banner hidden (onboarding already completed)
5. Dashboard content fully displayed

### Flow 3: User Wants to Review Onboarding
1. User can click "Onboarding Guide" in sidebar
2. Navigates to `/onboarding`
3. Can re-run wizard if desired
4. Completion updates timestamp but maintains status

## Features

### 1. Onboarding Status Tracking
- **Client-side**: useOnboarding hook with real-time queries
- **Server-side**: Convex database persistence
- **Clerk Integration**: User identification via `user.id` (clerkId)

### 2. Smart Dismissal
- Onboarding banner dismissible without completing
- "Dismiss" button (X icon) hides banner for session
- Users can re-open via "Onboarding Guide" in sidebar

### 3. Protected Routes
- Onboarding page requires authentication
- Unauthenticated users redirected to `/sign-in`
- Loading state shown during auth check

### 4. Seamless Navigation
- Sidebar integration for easy access
- Dashboard link from completion page
- Clear navigation flow throughout wizard

### 5. Design Consistency
- Matches existing dashboard design system
- Uses Wise color palette
- Responsive design for all screen sizes
- Dark mode support ready

## File Locations

```
frontend/
├── src/
│   ├── app/
│   │   ├── onboarding/
│   │   │   ├── page.tsx (updated)
│   │   │   ├── layout.tsx (created)
│   │   ├── dashboard/
│   │   │   ├── page.tsx (updated)
│   │   │   └── layout.tsx (updated)
│   ├── components/
│   │   └── onboarding/
│   │       ├── OnboardingWizard.tsx (updated)
│   │       ├── ProgressBar.tsx
│   │       ├── WelcomeStep.tsx
│   │       ├── ClientRegistrationStep.tsx
│   │       ├── MCPServerStep.tsx
│   │       ├── TestIntegrationStep.tsx
│   │       └── CompletionStep.tsx
│   └── hooks/
│       └── useOnboarding.ts (created)
├── convex/
│   ├── schema.ts (updated)
│   └── users.ts (updated)
└── ONBOARDING_INTEGRATION.md (created)
```

## Implementation Details

### Key Changes Summary

1. **Schema Enhancement**
   - Added `onboardingCompleted` and `onboardingCompletedAt` to users table
   - Maintains backward compatibility (optional fields)

2. **Convex Functions**
   - `getOnboardingStatus`: Check current status
   - `completeOnboarding`: Mark as complete with timestamp

3. **Custom Hook**
   - Simplifies component integration
   - Handles loading states
   - Provides completion function

4. **Dashboard Integration**
   - Conditional banner display based on status
   - Dismissible without losing functionality
   - Non-intrusive design

5. **Navigation**
   - "Getting Started" section in sidebar
   - Easy access to onboarding guide
   - Clear visibility for users

6. **Authentication**
   - Onboarding route protected
   - Redirect to sign-in if unauthenticated
   - Loading state during auth check

## Testing Checklist

- [ ] New user sees onboarding banner on dashboard
- [ ] Banner dismissible (X button works)
- [ ] "Start Setup Guide" button navigates to `/onboarding`
- [ ] Unauthenticated user redirected from `/onboarding` to `/sign-in`
- [ ] Onboarding wizard completes successfully
- [ ] Completion mutation updates database
- [ ] Banner hidden after completion
- [ ] "Onboarding Guide" link in sidebar always visible
- [ ] Dashboard loads correctly with various data scenarios
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] No console errors or TypeScript issues
- [ ] Convex queries/mutations working correctly

## Future Enhancements

1. **Analytics**
   - Track onboarding completion rates
   - Monitor step drop-off rates
   - Identify user friction points

2. **Customization**
   - Brand-specific onboarding flows
   - A/B testing different flows
   - Conditional steps based on user type

3. **Advanced Features**
   - Skip individual steps
   - Save progress between sessions
   - Email reminders for incomplete onboarding
   - Video tutorials integration

4. **Re-onboarding**
   - Allow users to restart from any step
   - Show progress indicator on re-runs
   - Skip completed steps option

## Troubleshooting

### Onboarding banner not showing
- Check `useOnboarding` hook is imported correctly
- Verify Convex functions are deployed
- Check browser console for errors
- Ensure `onboardingCompleted` field exists in database

### Completion not persisting
- Check Convex mutation is executing (check Convex dashboard)
- Verify user is authenticated (check userId in console)
- Ensure schema migration was run
- Check network tab for mutation call

### Navigation issues
- Verify routes exist: `/onboarding`, `/dashboard`, `/sign-in`
- Check Next.js routing configuration
- Clear Next.js build cache and rebuild

### Styling issues
- Verify Tailwind classes are recognized
- Check existing design system classes are used
- Ensure color variables are defined

## Dependencies

- React 18+
- Next.js 13+ (App Router)
- Clerk for authentication
- Convex for database/backend
- Framer Motion for animations
- Tailwind CSS for styling
- Lucide React for icons

## Related Documentation

- [Clerk Authentication](https://clerk.com/docs)
- [Convex Database](https://docs.convex.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
