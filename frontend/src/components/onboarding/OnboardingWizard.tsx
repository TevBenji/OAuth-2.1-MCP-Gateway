'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ProgressBar, Step } from './ProgressBar';
import { WelcomeStep } from './WelcomeStep';
import { ClientRegistrationStep, ClientData } from './ClientRegistrationStep';
import { MCPServerStep, MCPServerData } from './MCPServerStep';
import { TestIntegrationStep } from './TestIntegrationStep';
import { CompletionStep } from './CompletionStep';
import { useRouter } from 'next/navigation';

const STEPS: Step[] = [
  { id: 'welcome', label: 'Welcome', description: 'Introduction' },
  { id: 'client', label: 'Client Setup', description: 'Register app' },
  { id: 'mcp', label: 'MCP Servers', description: 'Optional' },
  { id: 'test', label: 'Test Integration', description: 'Get credentials' },
  { id: 'complete', label: 'Complete', description: 'All done!' },
];

interface OnboardingData {
  client?: ClientData;
  mcpServers?: MCPServerData;
  clientId?: string;
  clientSecret?: string;
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleWelcomeNext = () => {
    setCurrentStep(2);
  };

  const handleClientRegistration = async (data: ClientData) => {
    setIsSubmitting(true);
    try {
      // TODO: Make API call to register client
      // const response = await fetch('/api/clients', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // const result = await response.json();

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock response data
      const mockClientId = `client_${Math.random().toString(36).substr(2, 9)}`;
      const mockClientSecret = `secret_${Math.random().toString(36).substr(2, 24)}`;

      setOnboardingData({
        ...onboardingData,
        client: data,
        clientId: mockClientId,
        clientSecret: mockClientSecret,
      });

      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to register client:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMCPConfiguration = async (data: MCPServerData) => {
    if (!data.skipConfiguration && data.servers.length > 0) {
      setIsSubmitting(true);
      try {
        // TODO: Make API call to configure MCP servers
        // await fetch('/api/mcp-servers', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ servers: data.servers }),
        // });

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        setOnboardingData({
          ...onboardingData,
          mcpServers: data,
        });
      } catch (error) {
        console.error('Failed to configure MCP servers:', error);
        // TODO: Show error toast/notification
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setOnboardingData({
        ...onboardingData,
        mcpServers: { servers: [], skipConfiguration: true },
      });
    }

    setCurrentStep(4);
  };

  const handleSkipMCP = () => {
    setOnboardingData({
      ...onboardingData,
      mcpServers: { servers: [], skipConfiguration: true },
    });
    setCurrentStep(4);
  };

  const handleTestNext = () => {
    setCurrentStep(5);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Mark onboarding as complete
      // await fetch('/api/user/onboarding-complete', { method: 'POST' });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-wise-gray-50 to-white dark:from-wise-gray-900 dark:to-wise-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <ProgressBar steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && <WelcomeStep key="welcome" onNext={handleWelcomeNext} />}

          {currentStep === 2 && (
            <ClientRegistrationStep
              key="client"
              onNext={handleClientRegistration}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <MCPServerStep
              key="mcp"
              onNext={handleMCPConfiguration}
              onBack={handleBack}
              onSkip={handleSkipMCP}
            />
          )}

          {currentStep === 4 && onboardingData.clientId && onboardingData.clientSecret && (
            <TestIntegrationStep
              key="test"
              onNext={handleTestNext}
              onBack={handleBack}
              clientId={onboardingData.clientId}
              clientSecret={onboardingData.clientSecret}
            />
          )}

          {currentStep === 5 && <CompletionStep key="complete" onFinish={handleFinish} />}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-wise-gray-800 rounded-lg p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-wise-green-500 border-t-transparent mb-4" />
              <p className="text-wise-gray-900 dark:text-wise-gray-100 font-medium">
                Processing...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
