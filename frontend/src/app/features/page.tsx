'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Lock,
  Code,
  Globe,
  Users,
  CheckCircle,
  BarChart3,
  Key,
  Server,
  FileText,
  Bell,
  RefreshCw,
  Terminal,
  Database,
  Cloud,
  Workflow,
  GitBranch,
  Activity,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Shield,
      title: 'OAuth 2.1 Compliant',
      description: 'Fully compliant with OAuth 2.1 specification including PKCE, DPoP, and token binding for maximum security.',
      details: [
        'PKCE (Proof Key for Code Exchange) required',
        'Token binding prevents token theft',
        'DPoP (Demonstrating Proof-of-Possession)',
        'Automatic refresh token rotation'
      ]
    },
    {
      icon: Zap,
      title: 'Lightning Fast Performance',
      description: 'Built on Cloudflare Workers for global edge performance with sub-50ms latency worldwide.',
      details: [
        '<50ms global latency',
        '99.99% uptime SLA',
        'Automatic scaling',
        'Edge caching optimization'
      ]
    },
    {
      icon: Lock,
      title: 'Zero Trust Architecture',
      description: 'Every request is verified, encrypted, and audited with complete transparency and security.',
      details: [
        'End-to-end encryption',
        'Complete audit logging',
        'IP allowlisting support',
        'Rate limiting & DDoS protection'
      ]
    },
    {
      icon: Code,
      title: 'MCP Native Integration',
      description: 'Purpose-built for Model Context Protocol with seamless integration and native support.',
      details: [
        'Native MCP protocol support',
        'Automatic server discovery',
        'Built-in middleware',
        'SDK for all major languages'
      ]
    },
    {
      icon: Globe,
      title: 'Multi-Provider Support',
      description: 'Connect any OAuth provider including Google, GitHub, Microsoft, and custom implementations.',
      details: [
        'Google, GitHub, Microsoft',
        'Custom OAuth 2.1 providers',
        'SAML & SSO integration',
        'Social login providers'
      ]
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Manage teams, projects, and permissions with granular access control and role-based permissions.',
      details: [
        'Role-based access control (RBAC)',
        'Team & organization management',
        'Project-level permissions',
        'Activity audit logs'
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time analytics and insights into API usage, authentication patterns, and performance metrics.'
    },
    {
      icon: Key,
      title: 'API Key Management',
      description: 'Create, rotate, and manage API keys with scoped permissions and automatic expiration.'
    },
    {
      icon: Server,
      title: 'MCP Server Registry',
      description: 'Centralized registry for all your MCP servers with automatic discovery and health monitoring.'
    },
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Instant notifications for authentication failures, rate limits, and security events.'
    },
    {
      icon: RefreshCw,
      title: 'Token Auto-Refresh',
      description: 'Automatic token refresh and rotation with intelligent retry logic and error handling.'
    },
    {
      icon: Terminal,
      title: 'Developer Tools',
      description: 'CLI tools, SDKs, and debugging utilities for rapid development and testing.'
    },
    {
      icon: Database,
      title: 'Data Residency',
      description: 'Choose where your data is stored with support for multiple regions and compliance requirements.'
    },
    {
      icon: Cloud,
      title: 'Cloud-Native',
      description: 'Built for the cloud with automatic scaling, zero-downtime deployments, and high availability.'
    },
    {
      icon: Workflow,
      title: 'Webhook Support',
      description: 'Receive real-time webhooks for authentication events, token refresh, and security alerts.'
    },
    {
      icon: GitBranch,
      title: 'Environments',
      description: 'Separate development, staging, and production environments with isolated configurations.'
    },
    {
      icon: Activity,
      title: 'Health Monitoring',
      description: 'Comprehensive health checks and monitoring for all integrated services and providers.'
    },
    {
      icon: FileText,
      title: 'Audit Logs',
      description: 'Complete audit trail of all authentication attempts, API calls, and configuration changes.'
    }
  ];

  const securityFeatures = [
    'SOC 2 Type II certified',
    'GDPR & CCPA compliant',
    'ISO 27001 certified',
    'Regular security audits',
    'Penetration testing',
    'Bug bounty program',
    'Zero-knowledge architecture',
    'Hardware security modules (HSM)'
  ];

  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation */}
      <nav className='fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-wise-gray-200 z-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                <Shield className='w-5 h-5 text-white' />
              </div>
              <span className='font-bold text-xl text-wise-gray-900'>MCP Gateway</span>
            </Link>
            <div className='flex items-center space-x-4'>
              <Link href='/pricing' className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'>
                Pricing
              </Link>
              <Link href='/docs' className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'>
                Documentation
              </Link>
              <Link href='/dashboard' className='btn-wise-primary px-6 py-2'>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-wise-gray-50 to-white'>
        <div className='container mx-auto max-w-4xl text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='inline-flex items-center space-x-2 bg-wise-green-50 text-wise-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6'
          >
            <Sparkles className='w-4 h-4' />
            <span>Everything you need for secure authentication</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='text-5xl lg:text-6xl font-bold text-wise-gray-900 mb-6'
          >
            Built for <span className='text-wise-green-primary'>Security</span> &{' '}
            <span className='text-wise-green-primary'>Performance</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='text-xl text-wise-gray-600 mb-8'
          >
            Enterprise-grade features designed for modern developers. From OAuth 2.1 compliance to
            global edge performance, we've got you covered.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='flex flex-col sm:flex-row gap-4 justify-center'
          >
            <Link href='/sign-up' className='btn-wise-primary px-8 py-3 text-lg'>
              Start Free Trial
            </Link>
            <Link href='/contact' className='btn-wise-outline px-8 py-3 text-lg'>
              Contact Sales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-7xl'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>Core Features</h2>
            <p className='text-xl text-wise-gray-600'>
              Everything you need for secure, scalable authentication
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='card-wise p-8 hover:shadow-wise-hover transition-shadow'
              >
                <div className='w-14 h-14 bg-wise-green-50 rounded-xl flex items-center justify-center mb-6'>
                  <feature.icon className='w-7 h-7 text-wise-green-primary' />
                </div>
                <h3 className='text-xl font-bold text-wise-gray-900 mb-3'>{feature.title}</h3>
                <p className='text-wise-gray-600 mb-4'>{feature.description}</p>
                <ul className='space-y-2'>
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className='flex items-start text-sm'>
                      <CheckCircle className='w-4 h-4 text-wise-green-primary mr-2 mt-0.5 flex-shrink-0' />
                      <span className='text-wise-gray-700'>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-wise-gray-50'>
        <div className='container mx-auto max-w-7xl'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>Additional Features</h2>
            <p className='text-xl text-wise-gray-600'>
              Powerful tools and integrations for every use case
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className='bg-white rounded-lg p-6 border border-wise-gray-200 hover:border-wise-green-primary transition-colors'
              >
                <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                  <feature.icon className='w-6 h-6 text-wise-green-primary' />
                </div>
                <h3 className='font-semibold text-wise-gray-900 mb-2'>{feature.title}</h3>
                <p className='text-sm text-wise-gray-600'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-5xl'>
          <div className='text-center mb-12'>
            <div className='inline-flex items-center space-x-2 bg-wise-green-50 text-wise-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4'>
              <Award className='w-4 h-4' />
              <span>Enterprise Security</span>
            </div>
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>
              Security & Compliance First
            </h2>
            <p className='text-xl text-wise-gray-600'>
              Industry-leading security standards and certifications
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className='card-wise p-4 text-center'
              >
                <CheckCircle className='w-8 h-8 text-wise-green-primary mx-auto mb-3' />
                <p className='text-sm font-medium text-wise-gray-900'>{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-wise-green-primary'>
        <div className='container mx-auto max-w-4xl text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className='text-4xl font-bold text-white mb-4'>
              Ready to get started?
            </h2>
            <p className='text-xl text-wise-green-100 mb-8'>
              Join thousands of developers using MCP Gateway for secure authentication
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/sign-up'
                className='bg-white text-wise-green-primary hover:bg-wise-green-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors'
              >
                Start Free Trial
              </Link>
              <Link
                href='/pricing'
                className='bg-wise-green-600 text-white hover:bg-wise-green-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors'
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
