'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Book,
  Code,
  Terminal,
  ChevronRight,
  Search,
  Menu,
  X,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Lock,
  Globe,
  Key,
  Server,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navigation = [
    {
      section: 'Getting Started',
      items: [
        { label: 'Introduction', href: '#introduction' },
        { label: 'Quick Start', href: '#quick-start' },
        { label: 'Authentication', href: '#authentication' },
      ],
    },
    {
      section: 'API Reference',
      items: [
        { label: 'OAuth Flow', href: '#oauth-flow' },
        { label: 'Token Management', href: '#token-management' },
        { label: 'API Keys', href: '#api-keys' },
      ],
    },
    {
      section: 'Integration',
      items: [
        { label: 'MCP Servers', href: '#mcp-servers' },
        { label: 'Providers', href: '#providers' },
        { label: 'Webhooks', href: '#webhooks' },
      ],
    },
    {
      section: 'Security',
      items: [
        { label: 'OAuth 2.1', href: '#oauth-2-1' },
        { label: 'PKCE', href: '#pkce' },
        { label: 'Best Practices', href: '#best-practices' },
      ],
    },
  ];

  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation */}
      <nav className='fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-wise-gray-200 z-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                  <Shield className='w-5 h-5 text-white' />
                </div>
                <span className='font-bold text-xl text-wise-gray-900'>MCP Gateway</span>
              </Link>
              <span className='ml-4 text-wise-gray-400'>/</span>
              <span className='ml-4 text-wise-gray-700 font-medium'>Documentation</span>
            </div>
            <div className='flex items-center space-x-4'>
              <Link href='/dashboard' className='btn-wise-primary px-6 py-2'>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className='flex pt-16'>
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-wise-gray-50 border-r border-wise-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className='h-full overflow-y-auto pt-16 lg:pt-0'>
            <div className='p-4'>
              <div className='relative mb-4'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wise-gray-400' />
                <input
                  type='text'
                  placeholder='Search docs...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm border border-wise-gray-200 focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20'
                />
              </div>

              <nav className='space-y-6'>
                {navigation.map((section) => (
                  <div key={section.section}>
                    <h3 className='px-3 text-xs font-semibold text-wise-gray-500 uppercase tracking-wider mb-2'>
                      {section.section}
                    </h3>
                    <ul className='space-y-1'>
                      {section.items.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            className='flex items-center px-3 py-2 text-sm text-wise-gray-700 hover:bg-white hover:text-wise-green-primary rounded-lg transition-colors'
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-6 lg:p-12 overflow-y-auto'>
          <div className='max-w-4xl mx-auto'>
            {/* Introduction */}
            <section id='introduction' className='mb-16'>
              <h1 className='text-4xl font-bold text-wise-gray-900 mb-4'>
                MCP Gateway Documentation
              </h1>
              <p className='text-xl text-wise-gray-600 mb-8'>
                Enterprise-grade OAuth 2.1 authentication for Model Context Protocol servers.
                Secure, scalable, and easy to integrate.
              </p>

              <div className='grid md:grid-cols-3 gap-6 mb-8'>
                <div className='card-wise p-6'>
                  <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                    <Zap className='w-6 h-6 text-wise-green-primary' />
                  </div>
                  <h3 className='font-semibold text-wise-gray-900 mb-2'>Fast Integration</h3>
                  <p className='text-sm text-wise-gray-600'>
                    Get up and running in minutes with our simple API
                  </p>
                </div>
                <div className='card-wise p-6'>
                  <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                    <Lock className='w-6 h-6 text-wise-green-primary' />
                  </div>
                  <h3 className='font-semibold text-wise-gray-900 mb-2'>OAuth 2.1 Compliant</h3>
                  <p className='text-sm text-wise-gray-600'>
                    Fully compliant with the latest OAuth 2.1 standard
                  </p>
                </div>
                <div className='card-wise p-6'>
                  <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                    <Globe className='w-6 h-6 text-wise-green-primary' />
                  </div>
                  <h3 className='font-semibold text-wise-gray-900 mb-2'>Global Edge Network</h3>
                  <p className='text-sm text-wise-gray-600'>
                    &lt;50ms latency worldwide on Cloudflare Workers
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Start */}
            <section id='quick-start' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Quick Start</h2>

              <div className='space-y-6'>
                <div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-4'>
                    1. Create an Account
                  </h3>
                  <p className='text-wise-gray-600 mb-4'>
                    Sign up for a free account and get your API keys from the dashboard.
                  </p>
                  <Link href='/sign-up' className='btn-wise-primary inline-flex items-center'>
                    Create Account
                    <ChevronRight className='w-4 h-4 ml-2' />
                  </Link>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-4'>
                    2. Install the SDK
                  </h3>
                  <div className='relative'>
                    <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto'>
                      <code>{`npm install @mcp-gateway/sdk`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard('npm install @mcp-gateway/sdk', 'install')}
                      className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                    >
                      {copiedCode === 'install' ? (
                        <Check className='w-4 h-4 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-4 h-4 text-wise-gray-400' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-4'>
                    3. Initialize the Client
                  </h3>
                  <div className='relative'>
                    <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto'>
                      <code>{`import { MCPGateway } from '@mcp-gateway/sdk';

const gateway = new MCPGateway({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Start OAuth flow
const authUrl = await gateway.auth.authorize({
  provider: 'google',
  redirectUri: 'https://your-app.com/callback',
  scopes: ['openid', 'email', 'profile']
});`}</code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { MCPGateway } from '@mcp-gateway/sdk';\n\nconst gateway = new MCPGateway({\n  apiKey: 'your-api-key',\n  environment: 'production'\n});\n\n// Start OAuth flow\nconst authUrl = await gateway.auth.authorize({\n  provider: 'google',\n  redirectUri: 'https://your-app.com/callback',\n  scopes: ['openid', 'email', 'profile']\n});`,
                          'init'
                        )
                      }
                      className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                    >
                      {copiedCode === 'init' ? (
                        <Check className='w-4 h-4 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-4 h-4 text-wise-gray-400' />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id='authentication' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Authentication</h2>
              <p className='text-wise-gray-600 mb-6'>
                All API requests require authentication using your API key. Include it in the
                Authorization header:
              </p>
              <div className='relative'>
                <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto'>
                  <code>{`Authorization: Bearer YOUR_API_KEY`}</code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth-header')
                  }
                  className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                >
                  {copiedCode === 'auth-header' ? (
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  ) : (
                    <Copy className='w-4 h-4 text-wise-gray-400' />
                  )}
                </button>
              </div>

              <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start'>
                <AlertCircle className='w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0' />
                <div>
                  <p className='text-sm font-medium text-blue-900 mb-1'>Keep your API keys secure</p>
                  <p className='text-sm text-blue-800'>
                    Never expose your API keys in client-side code or public repositories. Use environment
                    variables or secret management services.
                  </p>
                </div>
              </div>
            </section>

            {/* OAuth Flow */}
            <section id='oauth-flow' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>OAuth Flow</h2>
              <p className='text-wise-gray-600 mb-6'>
                MCP Gateway supports the OAuth 2.1 authorization code flow with PKCE for maximum security.
              </p>

              <div className='space-y-6'>
                <div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-4'>
                    1. Start Authorization
                  </h3>
                  <div className='relative'>
                    <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                      <code>{`POST /v1/oauth/authorize

{
  "provider": "google",
  "redirect_uri": "https://your-app.com/callback",
  "scopes": ["openid", "email", "profile"],
  "state": "random-state-value"
}`}</code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `POST /v1/oauth/authorize\n\n{\n  "provider": "google",\n  "redirect_uri": "https://your-app.com/callback",\n  "scopes": ["openid", "email", "profile"],\n  "state": "random-state-value"\n}`,
                          'oauth-start'
                        )
                      }
                      className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                    >
                      {copiedCode === 'oauth-start' ? (
                        <Check className='w-4 h-4 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-4 h-4 text-wise-gray-400' />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-4'>2. Handle Callback</h3>
                  <div className='relative'>
                    <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                      <code>{`POST /v1/oauth/token

{
  "code": "authorization-code",
  "redirect_uri": "https://your-app.com/callback",
  "code_verifier": "pkce-verifier"
}`}</code>
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `POST /v1/oauth/token\n\n{\n  "code": "authorization-code",\n  "redirect_uri": "https://your-app.com/callback",\n  "code_verifier": "pkce-verifier"\n}`,
                          'oauth-token'
                        )
                      }
                      className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                    >
                      {copiedCode === 'oauth-token' ? (
                        <Check className='w-4 h-4 text-wise-green-primary' />
                      ) : (
                        <Copy className='w-4 h-4 text-wise-gray-400' />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* MCP Servers */}
            <section id='mcp-servers' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>MCP Server Integration</h2>
              <p className='text-wise-gray-600 mb-6'>
                Integrate OAuth authentication with your Model Context Protocol servers in minutes.
              </p>

              <div className='relative'>
                <pre className='bg-wise-gray-900 text-wise-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  <code>{`// Configure your MCP server
const server = new MCPServer({
  auth: {
    gateway: 'https://api.mcpgateway.com',
    apiKey: process.env.MCP_GATEWAY_API_KEY,
    provider: 'google'
  }
});

// Protect your endpoints
server.use(async (req, res, next) => {
  const token = await gateway.auth.verify(req.headers.authorization);
  req.user = token.user;
  next();
});`}</code>
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `// Configure your MCP server\nconst server = new MCPServer({\n  auth: {\n    gateway: 'https://api.mcpgateway.com',\n    apiKey: process.env.MCP_GATEWAY_API_KEY,\n    provider: 'google'\n  }\n});\n\n// Protect your endpoints\nserver.use(async (req, res, next) => {\n  const token = await gateway.auth.verify(req.headers.authorization);\n  req.user = token.user;\n  next();\n});`,
                      'mcp-server'
                    )
                  }
                  className='absolute top-4 right-4 p-2 rounded-lg hover:bg-wise-gray-800 transition-colors'
                >
                  {copiedCode === 'mcp-server' ? (
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  ) : (
                    <Copy className='w-4 h-4 text-wise-gray-400' />
                  )}
                </button>
              </div>
            </section>

            {/* OAuth 2.1 */}
            <section id='oauth-2-1' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>OAuth 2.1 Compliance</h2>
              <p className='text-wise-gray-600 mb-6'>
                MCP Gateway is fully compliant with the OAuth 2.1 specification, including:
              </p>

              <ul className='space-y-3'>
                <li className='flex items-start'>
                  <div className='w-6 h-6 bg-wise-green-50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0'>
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  </div>
                  <div>
                    <strong className='text-wise-gray-900'>PKCE (RFC 7636):</strong>
                    <span className='text-wise-gray-600'> Proof Key for Code Exchange required for all flows</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='w-6 h-6 bg-wise-green-50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0'>
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  </div>
                  <div>
                    <strong className='text-wise-gray-900'>Token Binding:</strong>
                    <span className='text-wise-gray-600'> Prevents token theft and replay attacks</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='w-6 h-6 bg-wise-green-50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0'>
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  </div>
                  <div>
                    <strong className='text-wise-gray-900'>DPoP (RFC 9449):</strong>
                    <span className='text-wise-gray-600'> Demonstrating Proof-of-Possession at the application layer</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <div className='w-6 h-6 bg-wise-green-50 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0'>
                    <Check className='w-4 h-4 text-wise-green-primary' />
                  </div>
                  <div>
                    <strong className='text-wise-gray-900'>Refresh Token Rotation:</strong>
                    <span className='text-wise-gray-600'> Automatic rotation for enhanced security</span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Best Practices */}
            <section id='best-practices' className='mb-16'>
              <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Security Best Practices</h2>

              <div className='space-y-6'>
                <div className='card-wise p-6'>
                  <div className='flex items-start'>
                    <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center mr-4 flex-shrink-0'>
                      <Key className='w-5 h-5 text-wise-green-primary' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-wise-gray-900 mb-2'>Use Environment Variables</h3>
                      <p className='text-sm text-wise-gray-600'>
                        Store API keys and secrets in environment variables, never in source code.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='card-wise p-6'>
                  <div className='flex items-start'>
                    <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center mr-4 flex-shrink-0'>
                      <Lock className='w-5 h-5 text-wise-green-primary' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-wise-gray-900 mb-2'>Validate Redirect URIs</h3>
                      <p className='text-sm text-wise-gray-600'>
                        Always whitelist and validate redirect URIs to prevent open redirect vulnerabilities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='card-wise p-6'>
                  <div className='flex items-start'>
                    <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center mr-4 flex-shrink-0'>
                      <Server className='w-5 h-5 text-wise-green-primary' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-wise-gray-900 mb-2'>Use HTTPS Only</h3>
                      <p className='text-sm text-wise-gray-600'>
                        Always use HTTPS for redirect URIs and API endpoints to prevent token interception.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Need Help? */}
            <section className='bg-wise-gray-50 rounded-lg p-8 text-center'>
              <h2 className='text-2xl font-bold text-wise-gray-900 mb-4'>Need Help?</h2>
              <p className='text-wise-gray-600 mb-6'>
                Our support team is here to help you get started and answer any questions.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Link href='/contact' className='btn-wise-primary px-6 py-3'>
                  Contact Support
                </Link>
                <a
                  href='https://github.com'
                  className='btn-wise-outline px-6 py-3 inline-flex items-center'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  View on GitHub
                  <ExternalLink className='w-4 h-4 ml-2' />
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
