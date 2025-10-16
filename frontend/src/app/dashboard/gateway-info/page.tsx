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
  CheckCircle,
  ArrowRight,
  Code,
  FileText,
  Cpu,
  RotateCcw,
  UserCheck,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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
      details: 'GET /authorize?response_type=code&client_id=...&code_challenge=...&state=...',
    },
    {
      icon: RotateCcw,
      step: 2,
      title: 'Token Exchange',
      description: 'Exchange authorization code for access token',
      details: 'POST /token with code_verifier for PKCE validation',
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

  const endpoints = [
    {
      method: 'GET',
      path: '/.well-known/oauth-authorization-server',
      description: 'OAuth 2.1 authorization server metadata discovery',
    },
    {
      method: 'GET',
      path: '/authorize',
      description: 'Authorization endpoint for OAuth flows',
    },
    {
      method: 'POST',
      path: '/token',
      description: 'Token endpoint for exchanging authorization codes',
    },
    {
      method: 'POST',
      path: '/register',
      description: 'Dynamic client registration endpoint (RFC 7591)',
    },
    {
      method: 'GET',
      path: '/mcp/:serverId/*',
      description: 'Proxy requests to MCP servers by server ID',
    },
    {
      method: 'GET',
      path: '/mcp/resource/*',
      description: 'Proxy requests using resource identifiers (RFC 8707)',
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='space-y-4'
      >
        <h1 className='text-3xl font-bold text-wise-gray-900'>OAuth 2.1 MCP Gateway</h1>
        <p className='text-wise-gray-600 max-w-3xl'>
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
          <h2 className='text-2xl font-bold text-wise-gray-900 mb-2'>
            Why OAuth 2.1 for MCP?
          </h2>
          <p className='text-wise-gray-600'>
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
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-wise-green-50 flex items-center justify-center'>
                <Lock className='w-5 h-5 text-wise-green-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-wise-gray-900 mb-1'>Enhanced Security</h3>
                <p className='text-wise-gray-600'>
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
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-wise-green-50 flex items-center justify-center'>
                <UserCheck className='w-5 h-5 text-wise-green-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-wise-gray-900 mb-1'>Seamless Integration</h3>
                <p className='text-wise-gray-600'>
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
          <h2 className='text-2xl font-bold text-wise-gray-900 mb-2'>
            Enterprise-Grade Features
          </h2>
          <p className='text-wise-gray-600'>
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
              className='card-wise p-6 hover:shadow-wise-hover transition-shadow'
            >
              <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                <feature.icon className='w-6 h-6 text-wise-green-primary' />
              </div>
              <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>{feature.title}</h3>
              <p className='text-wise-gray-600'>{feature.description}</p>
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
          <h2 className='text-2xl font-bold text-wise-gray-900 mb-2'>
            Gateway Architecture
          </h2>
          <p className='text-wise-gray-600'>
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
              <div className='flex-shrink-0 w-12 h-12 rounded-full bg-wise-green-primary text-white flex items-center justify-center font-bold mr-6 mt-1'>
                <step.icon className='w-6 h-6' />
              </div>
              <div className='flex-1 card-wise p-6'>
                <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>{step.title}</h3>
                <p className='text-wise-gray-600 mb-3'>{step.description}</p>
                <code className='text-sm bg-wise-gray-100 p-2 rounded text-wise-gray-800 font-mono'>
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
          <h2 className='text-2xl font-bold text-wise-gray-900 mb-2'>
            OAuth & MCP Endpoints
          </h2>
          <p className='text-wise-gray-600'>
            Key API endpoints provided by the gateway
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='card-wise p-6'
        >
          <div className='space-y-4'>
            {endpoints.map((endpoint, index) => (
              <div key={index} className='flex items-center py-3 border-b border-wise-gray-100 last:border-0'>
                <div className='flex-shrink-0 w-20'>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    endpoint.method === 'GET'
                      ? 'bg-blue-100 text-blue-800'
                      : endpoint.method === 'POST'
                        ? 'bg-wise-green-100 text-wise-green-800'
                        : 'bg-purple-100 text-purple-800'
                  }`}>
                    {endpoint.method}
                  </span>
                </div>
                <div className='flex-1 font-mono text-sm text-wise-gray-800'>{endpoint.path}</div>
                <div className='text-wise-gray-600 text-sm'>{endpoint.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Integration Section */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center max-w-3xl mx-auto'
        >
          <h2 className='text-2xl font-bold text-wise-gray-900 mb-2'>
            Ready to Secure Your MCP Ecosystem?
          </h2>
          <p className='text-wise-gray-600 mb-6'>
            Documentation and SDKs make integration straightforward
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/docs'
              className='btn-wise-primary px-6 py-3 inline-flex items-center justify-center space-x-2'
            >
              <FileText className='w-4 h-4' />
              <span>View Documentation</span>
              <ArrowRight className='w-4 h-4' />
            </Link>
            <Link
              href='/contact'
              className='btn-wise-secondary px-6 py-3 inline-flex items-center justify-center space-x-2'
            >
              <span>Contact Support</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
