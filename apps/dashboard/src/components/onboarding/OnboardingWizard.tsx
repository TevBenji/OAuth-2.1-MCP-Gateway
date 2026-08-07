'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProgressBar, Step } from './ProgressBar';
import { WelcomeStep } from './WelcomeStep';
import { MCPServerStep, MCPServerData } from './MCPServerStep';
import { ClientRegistrationStep, ClientData } from './ClientRegistrationStep';
import { TestIntegrationStep } from './TestIntegrationStep';
import { CompletionStep } from './CompletionStep';
import { registerOnboardingClient, registerOnboardingServers } from '@/app/onboarding/actions';

const STEPS: Step[] = [
  { id: 'welcome', label: 'Welcome', description: 'Introduction' },
  { id: 'mcp', label: 'MCP Servers', description: 'Optional' },
  { id: 'client', label: 'Client Setup', description: 'Register app' },
  { id: 'test', label: 'Test Integration', description: 'Get credentials' },
  { id: 'complete', label: 'Complete', description: 'All done!' },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMCPConfiguration = async (data: MCPServerData) => {
    setError(null);
    if (!data.skipConfiguration && data.servers.length > 0) {
      setIsSubmitting(true);
      try {
        await registerOnboardingServers(
          data.servers.map(s => ({ name: s.name, endpoint: s.endpoint }))
        );
      } catch {
        setError('Failed to register MCP servers. Is the gateway running?');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }
    setCurrentStep(3);
  };

  const handleClientRegistration = async (data: ClientData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const registration = await registerOnboardingClient({
        client_name: data.name,
        redirect_uris: data.redirectUris,
        token_endpoint_auth_method:
          data.applicationType === 'web' ? 'client_secret_basic' : 'none',
      });
      setClientId(registration.client_id);
      setClientSecret(registration.client_secret);
      setCurrentStep(4);
    } catch {
      setError('Failed to register the OAuth client. Is the gateway running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding-complete', 'true');
    router.push('/dashboard');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-wise-green-forest px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-wise-green-bright text-base font-black text-wise-green-forest">
            G
          </span>
          <span className="text-base font-semibold tracking-tight text-white">MCP Gateway</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <ProgressBar steps={STEPS} currentStep={currentStep} />
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && <WelcomeStep key="welcome" onNext={() => setCurrentStep(2)} />}

          {currentStep === 2 && (
            <MCPServerStep
              key="mcp"
              onNext={handleMCPConfiguration}
              onBack={handleBack}
              onSkip={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <ClientRegistrationStep
              key="client"
              onNext={handleClientRegistration}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && clientId && (
            <TestIntegrationStep
              key="test"
              onNext={() => setCurrentStep(5)}
              onBack={handleBack}
              clientId={clientId}
              clientSecret={clientSecret}
            />
          )}

          {currentStep === 5 && <CompletionStep key="complete" onFinish={handleFinish} />}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-wise-green-forest/40 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-xl border border-wise-gray-200 bg-white p-8">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-wise-green-primary border-t-transparent" />
              <p className="font-semibold text-wise-green-forest">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
