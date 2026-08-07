'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Copy, Check, Code, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8787';

interface TestIntegrationStepProps {
  onNext: () => void;
  onBack: () => void;
  clientId: string;
  clientSecret?: string;
}

export function TestIntegrationStep({
  onNext,
  onBack,
  clientId,
  clientSecret,
}: TestIntegrationStepProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const curlExample = `# 1. Discover the gateway's OAuth 2.1 configuration
curl ${GATEWAY_URL}/.well-known/oauth-authorization-server

# 2. Generate PKCE code verifier and challenge
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n $CODE_VERIFIER | openssl dgst -binary -sha256 | base64 | tr -d "=" | tr "+/" "-_")

# 3. Get an authorization code (open in browser)
echo "${GATEWAY_URL}/oauth/authorize\\
?client_id=${clientId}\\
&redirect_uri=YOUR_REDIRECT_URI\\
&response_type=code\\
&state=random-state\\
&code_challenge=$CODE_CHALLENGE\\
&code_challenge_method=S256"

# 4. Exchange the code for tokens
curl -X POST "${GATEWAY_URL}/oauth/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "redirect_uri=YOUR_REDIRECT_URI" \\
  -d "client_id=${clientId}" \\${clientSecret ? `\n  -d "client_secret=${clientSecret}" \\` : ''}
  -d "code_verifier=$CODE_VERIFIER"`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-3xl">Test Your Integration</CardTitle>
              <CardDescription className="text-base mt-1">
                Use these credentials against the gateway at {GATEWAY_URL}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Credentials Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-wise-green-forest">
              Your OAuth Credentials
            </h3>

            {/* Client ID */}
            <div className="rounded-lg border border-wise-gray-200 bg-wise-gray-50 p-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-sm font-medium text-wise-gray-700">
                  Client ID
                </label>
                <button
                  onClick={() => copyToClipboard(clientId, 'clientId')}
                  className="flex items-center text-sm font-semibold text-wise-green-700 hover:text-wise-green-forest"
                  aria-label="Copy client ID"
                >
                  {copiedItem === 'clientId' ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="break-all font-mono text-sm text-wise-gray-900">
                {clientId}
              </code>
            </div>

            {/* Client Secret */}
            {clientSecret && (
              <div className="rounded-lg border border-wise-gray-200 bg-wise-gray-50 p-4">
                <div className="flex justify-between items-start mb-2">
                  <label className="text-sm font-medium text-wise-gray-700">
                    Client Secret
                  </label>
                  <button
                    onClick={() => copyToClipboard(clientSecret, 'clientSecret')}
                    className="flex items-center text-sm font-semibold text-wise-green-700 hover:text-wise-green-forest"
                    aria-label="Copy client secret"
                  >
                    {copiedItem === 'clientSecret' ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <code className="break-all font-mono text-sm text-wise-gray-900">
                  {clientSecret}
                </code>
                <p className="mt-2 text-xs text-wise-gray-500">
                  ⚠️ This secret is shown only once — store it securely and never commit it to
                  version control.
                </p>
              </div>
            )}
          </div>

          {/* Curl Example Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-wise-green-forest">
              Try It with cURL
            </h3>
            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => copyToClipboard(curlExample, 'code')}
                  className="flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Copy code"
                >
                  {copiedItem === 'code' ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#081400] p-6 text-wise-gray-100">
                <code className="font-mono text-sm">{curlExample}</code>
              </pre>
            </div>
          </div>

          {/* Next Steps */}
          <div className="rounded-xl border border-wise-green-primary/30 bg-wise-green-50 p-4">
            <h4 className="mb-2 flex items-center font-bold text-wise-green-forest">
              <Code className="mr-2 h-5 w-5 text-wise-green-primary" />
              Next Steps
            </h4>
            <ul className="ml-7 space-y-1 text-sm text-wise-gray-700">
              <li>• Copy your credentials to a secure location</li>
              <li>• Run the discovery request to verify the gateway is reachable</li>
              <li>• Test the full OAuth flow from your application</li>
              <li>• Manage clients and servers anytime from the dashboard</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} icon={<ArrowLeft />}>
              Back
            </Button>
            <Button onClick={onNext} icon={<ArrowRight />} iconPosition="right">
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
