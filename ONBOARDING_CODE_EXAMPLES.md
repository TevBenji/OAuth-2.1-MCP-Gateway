# Onboarding Integration - Code Examples & Reference

Quick reference for using the onboarding system in your code.

## Using the useOnboarding Hook

### Basic Usage

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

export function MyComponent() {
  const { isCompleted, isLoading, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <p>Onboarding completed: {isCompleted ? 'Yes' : 'No'}</p>
      {!isCompleted && (
        <button onClick={completeOnboarding}>
          Complete Onboarding
        </button>
      )}
    </div>
  );
}
```

### Check Status Before Rendering

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

export function FeatureGate() {
  const { isCompleted, isLoading } = useOnboarding();

  // Don't show feature until onboarding is complete
  if (isLoading) return <Skeleton />;
  if (!isCompleted) return <CompleteOnboardingPrompt />;

  return <FeatureContent />;
}
```

### Handle Completion with Callback

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEffect } from 'react';

export function WizardComponent() {
  const { completeOnboarding } = useOnboarding();

  const handleWizardComplete = async () => {
    try {
      await completeOnboarding();
      console.log('Onboarding marked as complete!');
      // Additional logic after completion
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Show error message to user
    }
  };

  return (
    <button onClick={handleWizardComplete}>
      Finish Setup
    </button>
  );
}
```

## Conditional Rendering Examples

### Show Banner for New Users Only

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function OnboardingBanner() {
  const { isCompleted, isLoading } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already completed or dismissed
  if (isLoading || isCompleted || dismissed) {
    return null;
  }

  return (
    <div className='bg-wise-green-50 border border-wise-green-200 rounded-lg p-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-4'>
          <Sparkles className='w-5 h-5 text-wise-green-primary mt-1' />
          <div>
            <h3 className='font-semibold text-wise-gray-900'>
              Complete Your Setup
            </h3>
            <p className='text-sm text-wise-gray-700 mt-1'>
              Get started in 5 minutes
            </p>
            <Link href='/onboarding' className='btn-wise-primary mt-3'>
              Start Guide
            </Link>
          </div>
        </div>
        <button onClick={() => setDismissed(true)}>
          <X className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}
```

### Conditional Navigation

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedPage() {
  const { isCompleted, isLoading } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding if not completed
    if (!isLoading && !isCompleted) {
      router.push('/onboarding');
    }
  }, [isCompleted, isLoading, router]);

  if (isLoading || !isCompleted) {
    return <LoadingScreen />;
  }

  return <PageContent />;
}
```

## Convex Query/Mutation Usage

### Direct Query Usage

```typescript
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

export function ComponentUsingDirectQuery() {
  const { user } = useUser();

  const onboardingStatus = useQuery(
    api.users.getOnboardingStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  return (
    <div>
      Status: {onboardingStatus?.completed ? 'Complete' : 'Pending'}
    </div>
  );
}
```

### Direct Mutation Usage

```typescript
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

export function ComponentUsingDirectMutation() {
  const { user } = useUser();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const handleComplete = async () => {
    if (!user?.id) return;

    try {
      const result = await completeOnboarding({ clerkId: user.id });
      console.log('Completion result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <button onClick={handleComplete}>Complete</button>;
}
```

## Database & Schema Reference

### Users Table Schema

```typescript
users: {
  clerkId: string,              // From Clerk authentication
  email: string,                // User email
  name?: string,                // User name
  avatarUrl?: string,           // Avatar image URL
  role: "USER" | "ADMIN" | "SUPER_ADMIN",
  organizationId?: Id<"organizations">,
  lastActiveAt?: number,        // Last activity timestamp
  onboardingCompleted?: boolean, // NEW: Completion status
  onboardingCompletedAt?: number, // NEW: Completion timestamp
  createdAt: number,            // Account creation timestamp
  updatedAt: number,            // Last update timestamp
}
```

### Database Records Example

**New User (Not Completed)**:
```json
{
  "_id": "user_12345",
  "clerkId": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "organizationId": "org_xyz789",
  "onboardingCompleted": false,
  "onboardingCompletedAt": null,
  "createdAt": 1698531600000,
  "updatedAt": 1698531600000
}
```

**User After Completion**:
```json
{
  "_id": "user_12345",
  "clerkId": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "organizationId": "org_xyz789",
  "onboardingCompleted": true,
  "onboardingCompletedAt": 1698532500000,
  "createdAt": 1698531600000,
  "updatedAt": 1698532500000
}
```

## Convex Function Reference

### getOnboardingStatus

**Purpose**: Query current onboarding status

```typescript
// Usage
const status = useQuery(
  api.users.getOnboardingStatus,
  { clerkId: user.id }
);

// Returns
{
  completed: boolean,
  completedAt: number | null
}

// Example returns
{ completed: false, completedAt: null }        // Not completed
{ completed: true, completedAt: 1698532500000 } // Completed
```

### completeOnboarding

**Purpose**: Mark onboarding as complete

```typescript
// Usage
const mutation = useMutation(api.users.completeOnboarding);
await mutation({ clerkId: user.id });

// Returns
{
  completed: true,
  completedAt: number
}

// Example return
{ completed: true, completedAt: 1698532500000 }
```

## Navigation Flow Examples

### Sidebar Link Implementation

```typescript
// In dashboard/layout.tsx
const navigation = [
  {
    section: 'Getting Started',
    items: [
      {
        label: 'Onboarding Guide',
        href: '/onboarding',
        icon: Plus,
      },
    ],
  },
  // ... other sections
];
```

### Programmatic Navigation

```typescript
import { useRouter } from 'next/navigation';

export function NavigationComponent() {
  const router = useRouter();

  const goToOnboarding = () => {
    router.push('/onboarding');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <button onClick={goToOnboarding}>Start Setup</button>
      <button onClick={goToDashboard}>Go to Dashboard</button>
    </>
  );
}
```

## Authentication & Protection

### Protected Route Pattern

```typescript
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return <LoadingSpinner />;
  }

  return <PageContent />;
}
```

### Onboarding Page Protection

```typescript
// Exactly as implemented in src/app/onboarding/page.tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return <LoadingScreen />;
  }

  return <OnboardingWizard />;
}
```

## Component Integration Pattern

### Adding Onboarding to Existing Page

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

export default function DashboardPage() {
  const { isCompleted, isLoading } = useOnboarding();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-6'>
      {/* Show banner only for new users */}
      {!isCompleted && <OnboardingBanner />}

      {/* Rest of page content */}
      <DashboardContent />
    </div>
  );
}
```

## Error Handling

### Complete Error Handling

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { useState } from 'react';

export function OnboardingForm() {
  const { completeOnboarding } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await completeOnboarding();
      // Success - redirect or show success message
    } catch (err) {
      // Specific error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete onboarding. Please try again.');
      }
      console.error('Onboarding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Completing...' : 'Complete Setup'}
      </button>
    </div>
  );
}
```

## Testing Examples

### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboarding } from '@/hooks/useOnboarding';

jest.mock('@/hooks/useOnboarding');

test('shows banner for new users', () => {
  (useOnboarding as jest.Mock).mockReturnValue({
    isCompleted: false,
    isLoading: false,
    completedAt: null,
    completeOnboarding: jest.fn(),
  });

  render(<OnboardingBanner />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});

test('hides banner after dismissal', async () => {
  render(<OnboardingBanner />);
  const dismissButton = screen.getByLabelText('Dismiss');

  await userEvent.click(dismissButton);
  expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
});
```

## Common Patterns

### Loading State Management

```typescript
const { isLoading, isCompleted } = useOnboarding();

// Pattern 1: Skip queries during loading
if (isLoading) return <Skeleton />;

// Pattern 2: Conditional rendering based on state
{isCompleted ? <Content /> : <Prompt />}

// Pattern 3: Disable UI during loading
<button disabled={isLoading}>Continue</button>
```

### Timestamp Formatting

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

export function CompletionInfo() {
  const { completedAt } = useOnboarding();

  if (!completedAt) return <span>Not completed</span>;

  const date = new Date(completedAt);
  return <span>Completed: {date.toLocaleDateString()}</span>;
}
```

### URL Parameters for Deep Linking

```typescript
// Navigate to onboarding with return URL
router.push('/onboarding?returnTo=/dashboard/projects');

// In onboarding component
const searchParams = useSearchParams();
const returnTo = searchParams.get('returnTo') || '/dashboard';
```

## Advanced Usage

### Combining Multiple Hooks

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user } = useUser();
  const { isCompleted, completedAt } = useOnboarding();

  return (
    <div>
      <p>Name: {user?.firstName}</p>
      <p>Setup Complete: {isCompleted ? 'Yes' : 'No'}</p>
      {completedAt && (
        <p>Completed: {new Date(completedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
}
```

### Analytics Integration

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEffect } from 'react';

export function AnalyticsTracker() {
  const { isCompleted, completedAt } = useOnboarding();

  useEffect(() => {
    if (isCompleted && completedAt) {
      // Track completion event
      analytics.track('onboarding_completed', {
        completedAt,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isCompleted, completedAt]);

  return null;
}
```

---

**For more details, see:**
- `ONBOARDING_INTEGRATION.md` - Architecture and design
- `ONBOARDING_SETUP.md` - Setup and testing guide
