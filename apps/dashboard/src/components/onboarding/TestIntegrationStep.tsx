'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Copy, Check, Code, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TestIntegrationStepProps {
  onNext: () => void;
  onBack: () => void;
  clientId: string;
  clientSecret: string;
}

export function TestIntegrationStep({
  onNext,
  onBack,
  clientId,
  clientSecret,
}: TestIntegrationStepProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'curl'>(
    'javascript'
  );

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const codeExamples = {
    javascript: `// Install the SDK
npm install @oauth-mcp-gateway/sdk

// Initialize the client
import { OAuthClient } from '@oauth-mcp-gateway/sdk';

const client = new OAuthClient({
  clientId: '${clientId}',
  clientSecret: '${clientSecret}',
  redirectUri: 'https://your-app.com/callback',
  gatewayUrl: '${typeof window !== 'undefined' ? window.location.origin : 'https://your-gateway.com'}'
});

// Generate authorization URL
const authUrl = await client.getAuthorizationUrl({
  scope: 'read write',
  state: 'random-state-value'
});

// Redirect user to authUrl
window.location.href = authUrl;

// Exchange code for tokens (in your callback handler)
const tokens = await client.exchangeCodeForTokens(code);
console.log('Access token:', tokens.access_token);`,

    python: `# Install the SDK
pip install oauth-mcp-gateway-sdk

# Initialize the client
from oauth_mcp_gateway import OAuthClient

client = OAuthClient(
    client_id='${clientId}',
    client_secret='${clientSecret}',
    redirect_uri='https://your-app.com/callback',
    gateway_url='${typeof window !== 'undefined' ? window.location.origin : 'https://your-gateway.com'}'
)

# Generate authorization URL
auth_url = client.get_authorization_url(
    scope='read write',
    state='random-state-value'
)

# Redirect user to auth_url
print(f'Redirect to: {auth_url}')

# Exchange code for tokens (in your callback handler)
tokens = client.exchange_code_for_tokens(code)
print(f'Access token: {tokens["access_token"]}')`,

    curl: `# Step 1: Generate PKCE code verifier and challenge
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n $CODE_VERIFIER | openssl dgst -binary -sha256 | base64 | tr -d "=+/" | tr "/+" "_-")

# Step 2: Get authorization code (open in browser)
AUTH_URL="${typeof window !== 'undefined' ? window.location.origin : 'https://your-gateway.com'}/authorize\\
?client_id=${clientId}\\
&redirect_uri=https://your-app.com/callback\\
&response_type=code\\
&scope=read%20write\\
&state=random-state\\
&code_challenge=$CODE_CHALLENGE\\
&code_challenge_method=S256"

echo "Open in browser: $AUTH_URL"

# Step 3: Exchange code for tokens
curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://your-gateway.com'}/token" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "redirect_uri=https://your-app.com/callback" \\
  -d "client_id=${clientId}" \\
  -d "client_secret=${clientSecret}" \\
  -d "code_verifier=$CODE_VERIFIER"`,
  };

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
            <div className="h-12 w-12 rounded-lg bg-wise-purple/10 flex items-center justify-center mr-4">
              <Terminal className="h-6 w-6 text-wise-purple" />
            </div>
            <div>
              <CardTitle className="text-3xl">Test Your Integration</CardTitle>
              <CardDescription className="text-base mt-1">
                Use these credentials and code examples to get started
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Credentials Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-wise-gray-900 dark:text-wise-gray-100">
              Your OAuth Credentials
            </h3>

            {/* Client ID */}
            <div className="bg-wise-gray-50 dark:bg-wise-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-sm font-medium text-wise-gray-700 dark:text-wise-gray-300">
                  Client ID
                </label>
                <button
                  onClick={() => copyToClipboard(clientId, 'clientId')}
                  className="flex items-center text-sm text-wise-green-600 hover:text-wise-green-700"
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
              <code className="text-sm font-mono text-wise-gray-900 dark:text-wise-gray-100 break-all">
                {clientId}
              </code>
            </div>

            {/* Client Secret */}
            <div className="bg-wise-gray-50 dark:bg-wise-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <label className="text-sm font-medium text-wise-gray-700 dark:text-wise-gray-300">
                  Client Secret
                </label>
                <button
                  onClick={() => copyToClipboard(clientSecret, 'clientSecret')}
                  className="flex items-center text-sm text-wise-green-600 hover:text-wise-green-700"
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
              <code className="text-sm font-mono text-wise-gray-900 dark:text-wise-gray-100 break-all">
                {clientSecret}
              </code>
              <p className="mt-2 text-xs text-wise-gray-600 dark:text-wise-gray-400">
                ⚠️ Keep this secret secure! Don't commit it to version control.
              </p>
            </div>
          </div>

          {/* Code Examples Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-wise-gray-900 dark:text-wise-gray-100">
                Integration Code Examples
              </h3>
              <div className="flex gap-2">
                {(['javascript', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedLanguage === lang
                        ? 'bg-wise-green-500 text-white'
                        : 'bg-wise-gray-200 dark:bg-wise-gray-700 text-wise-gray-700 dark:text-wise-gray-300 hover:bg-wise-gray-300 dark:hover:bg-wise-gray-600'
                    )}
                  >
                    {lang === 'javascript'
                      ? 'JavaScript'
                      : lang === 'python'
                        ? 'Python'
                        : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => copyToClipboard(codeExamples[selectedLanguage], 'code')}
                  className="flex items-center px-3 py-1.5 text-sm bg-wise-gray-700 hover:bg-wise-gray-600 text-white rounded-lg transition-colors"
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
              <pre className="bg-wise-gray-900 text-wise-gray-100 rounded-lg p-6 overflow-x-auto">
                <code className="text-sm font-mono">{codeExamples[selectedLanguage]}</code>
              </pre>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-wise-blue/10 border border-wise-blue/30 rounded-lg p-4">
            <h4 className="font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-2 flex items-center">
              <Code className="h-5 w-5 mr-2 text-wise-blue" />
              Next Steps
            </h4>
            <ul className="space-y-1 text-sm text-wise-gray-700 dark:text-wise-gray-300 ml-7">
              <li>• Copy your credentials to a secure location</li>
              <li>• Integrate the code example into your application</li>
              <li>• Test the OAuth flow in your development environment</li>
              <li>• Review our comprehensive API documentation</li>
              <li>• Join our community for support and updates</li>
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
