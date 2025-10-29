import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding | OAuth 2.1 MCP Gateway',
  description: 'Get started with OAuth 2.1 MCP Gateway in minutes',
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
