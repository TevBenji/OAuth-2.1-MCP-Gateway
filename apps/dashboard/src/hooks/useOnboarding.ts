'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useOnboarding() {
  const { user } = useUser();

  const onboardingStatus = useQuery(
    api.users.getOnboardingStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const handleCompleteOnboarding = async () => {
    if (!user?.id) return;

    try {
      await completeOnboarding({ clerkId: user.id });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  return {
    isCompleted: onboardingStatus?.completed || false,
    completedAt: onboardingStatus?.completedAt || null,
    isLoading: onboardingStatus === undefined,
    completeOnboarding: handleCompleteOnboarding,
  };
}
