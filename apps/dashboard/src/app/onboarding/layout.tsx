import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding | OAuth 2.1 MCP Gateway',
  description: 'Get started with OAuth 2.1 MCP Gateway in minutes',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-gradient-to-b from-wise-gray-50 to-white dark:from-wise-gray-900 dark:to-wise-gray-800'>
      {children}
    </div>
  );
}
