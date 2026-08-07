import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding | OAuth 2.1 MCP Gateway',
  description: 'Get started with OAuth 2.1 MCP Gateway in minutes',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-wise-green-forest'>
      {children}
    </div>
  );
}
