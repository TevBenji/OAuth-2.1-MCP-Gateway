'use client';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading state while checking authentication
  if (!isLoaded || !userId) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-wise-gray-50 to-white'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard />;
}
