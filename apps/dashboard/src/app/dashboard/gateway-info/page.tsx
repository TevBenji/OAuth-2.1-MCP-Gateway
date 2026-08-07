'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Key,
  Globe,
  Zap,
  Lock,
  Users,
  Server,
  Cpu,
  RotateCcw,
  UserCheck,
  Monitor,
} from 'lucide-react';

export default function GatewayInfoPage() {
  const features = [
    {
      icon: Shield,
      title: 'OAuth 2.1 Compliance',
      description: 'Full implementation of OAuth 2.1 with mandatory PKCE for enhanced security',
    },
    {
      icon: Key,
      title: 'JWT Token Management',
      description: 'Secure token generation and validation with customizable claims',
    },
    {
      icon: Globe,
      title: 'Multi-Tenant Architecture',
      description: 'Isolated tenants with compliance tier support (HIPAA, PCI-DSS, SOX)',
    },
    {
      icon: Zap,
      title: 'Edge Computing Ready',
      description: 'Optimized for Cloudflare Workers with global low-latency performance',
    },
    {
      icon: Lock,
      title: 'Resource Indicators',
      description: 'RFC 8707 support for audience-specific tokens to MCP servers',
    },
    {
      icon: Users,
      title: 'Dynamic Client Registration',
      description: 'RFC 7591 implementation for automatic OAuth client onboarding',
    },
  ];

  const architecture = [
    {
      icon: Cpu,
      step: 1,
      title: 'Authorization Request',
      description: 'MCP clients initiate OAuth flow with PKCE parameters',
      details: 'GET /oauth/authorize?response_type=code&client_id=...&code_challenge=...&state=...',
    },
    {
      icon: RotateCcw,
      step: 2,
      title: 'Token Exchange',
      description: 'Exchange authorization code for access token',
      details: 'POST /oauth/token with code_verifier for PKCE validation',
    },
    {
      icon: Monitor,
      step: 3,
      title: 'MCP Request Proxying',
      description: 'Gateway validates token and forwards request to MCP server',
      details: 'Injects tenant context and security headers',
    },
    {
      icon: Server,
      step: 4,
      title: 'Response Return',
      description: 'Gateway returns MCP server response to client',
      details: 'With latency metrics and security logging',
    },
  ];

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8787';

  const endpoints = [
    {
      method: 'GET',
      path: '/.well-known/oauth-authorization-server',
      description: 'OAuth 2.1 authorization server metadata discovery',
    },
    {
      method: 'GET',
      path: '/oauth/authorize',
      description: 'Authorization endpoint for OAuth flows',
    },
    {
      method: 'POST',
      path: '/oauth/token',
      description: 'Token endpoint for exchanging authorization codes',
    },
    {
      method: 'POST',
      path: '/oauth/register',
      description: 'Dynamic client registration endpoint (RFC 7591)',
    },
    {
      method: 'ALL',
      path: '/mcp/:serverId/*',
      description: 'Proxy requests to MCP servers by server ID',
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
          Reference
        </p>
        <h1 className='mt-1 text-2xl font-extrabold tracking-tight text-wise-green-forest sm:text-3xl'>
          OAuth 2.1 MCP Gateway
        </h1>
        <p className='mt-1 max-w-3xl text-sm text-wise-gray-500'>
          Enterprise-grade authentication infrastructure transforming insecure static API keys to
          OAuth 2.1 with PKCE for Model Context Protocol servers.
        </p>
      </motion.div>

      {/* Benefits Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='mb-6'
        >
          <h2 className='mb-2 text-2xl font-extrabold tracking-tight text-wise-green-forest'>
            Why OAuth 2.1 for MCP?
          </h2>
          <p className='text-sm text-wise-gray-500'>
            Secure your Model Context Protocol ecosystem with industry-standard authentication
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 gap-6'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='card-wise p-6'
          >
            <div className='flex items-start gap-3'>
              <span className='inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
                <Lock className='h-[18px] w-[18px]' />
              </span>
              <div>
                <h3 className='mb-1 text-base font-bold text-wise-green-forest'>
                  Enhanced Security
                </h3>
                <p className='text-[14px] leading-relaxed text-wise-gray-500'>
                  Replace insecure API keys with enterprise-grade OAuth 2.1 authentication with PKCE
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='card-wise p-6'
          >
            <div className='flex items-start gap-3'>
              <span className='inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
                <UserCheck className='h-[18px] w-[18px]' />
              </span>
              <div>
                <h3 className='mb-1 text-base font-bold text-wise-green-forest'>
                  Seamless Integration
                </h3>
                <p className='text-[14px] leading-relaxed text-wise-gray-500'>
                  Works transparently with existing MCP clients and servers without code changes
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='mb-6'
        >
          <h2 className='mb-2 text-2xl font-extrabold tracking-tight text-wise-green-forest'>
            Enterprise-Grade Features
          </h2>
          <p className='text-sm text-wise-gray-500'>
            Built for security, performance, and compliance with industry standards
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='card-wise p-6'
            >
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
                <feature.icon className='h-[18px] w-[18px]' />
              </span>
              <h3 className='mb-1.5 mt-4 text-base font-bold text-wise-green-forest'>
                {feature.title}
              </h3>
              <p className='text-[14px] leading-relaxed text-wise-gray-500'>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='mb-6'
        >
          <h2 className='mb-2 text-2xl font-extrabold tracking-tight text-wise-green-forest'>
            Gateway Architecture
          </h2>
          <p className='text-sm text-wise-gray-500'>
            Four-step process for secure MCP authentication
          </p>
        </motion.div>

        <div className='space-y-6'>
          {architecture.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='flex items-start'
            >
              <div className='mr-6 mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-wise-green-bright text-wise-green-forest'>
                <step.icon className='h-5 w-5' />
              </div>
              <div className='card-wise flex-1 p-6'>
                <h3 className='mb-1.5 text-base font-bold text-wise-green-forest'>{step.title}</h3>
                <p className='mb-3 text-[14px] leading-relaxed text-wise-gray-500'>
                  {step.description}
                </p>
                <code className='rounded bg-wise-gray-100 p-2 font-mono text-sm text-wise-gray-800'>
                  {step.details}
                </code>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Endpoints Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='mb-6'
        >
          <h2 className='mb-2 text-2xl font-extrabold tracking-tight text-wise-green-forest'>
            OAuth & MCP Endpoints
          </h2>
          <p className='text-sm text-wise-gray-500'>
            Key API endpoints provided by the gateway
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='card-wise p-6'
        >
          <div className='mb-4 flex items-center border-b border-wise-gray-200 pb-4'>
            <span className='mr-3 text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Base URL
            </span>
            <code className='rounded bg-wise-gray-100 px-2 py-1 font-mono text-sm text-wise-gray-800'>
              {gatewayUrl}
            </code>
          </div>
          <div className='divide-y divide-wise-gray-200'>
            {endpoints.map((endpoint, index) => (
              <div key={index} className='flex items-center py-3 transition-colors hover:bg-wise-gray-50'>
                <div className='w-20 flex-shrink-0'>
                  <span
                    className={`rounded px-2 py-1 text-xs font-bold ${
                      endpoint.method === 'GET'
                        ? 'bg-wise-green-50 text-wise-green-700'
                        : endpoint.method === 'POST'
                          ? 'bg-wise-green-forest text-wise-green-bright'
                          : 'bg-wise-gray-100 text-wise-gray-600'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                </div>
                <div className='flex-1 font-mono text-sm text-wise-gray-800'>{endpoint.path}</div>
                <div className='text-sm text-wise-gray-500'>{endpoint.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

    </div>
  );
}
