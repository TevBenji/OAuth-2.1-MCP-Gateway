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

export default function GeneralPage() {
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

  const benefits = [
    {
      title: 'Enhanced Security',
      description: 'Replace insecure API keys with enterprise-grade OAuth 2.1 authentication',
    },
    {
      title: 'Seamless Integration',
      description: 'Works with existing MCP servers without requiring code changes',
    },
    {
      title: 'Comprehensive Auditing',
      description: 'Track all authentication events for compliance and security monitoring',
    },
    {
      title: 'Scalable Infrastructure',
      description: 'Handle millions of requests with global edge network deployment',
    },
  ];

  const architecture = [
    {
      step: 1,
      title: 'Authorization Request',
      description: 'MCP clients initiate OAuth flow with PKCE parameters',
      details: 'GET /authorize?response_type=code&client_id=...&code_challenge=...&state=...',
    },
    {
      step: 2,
      title: 'Token Exchange',
      description: 'Exchange authorization code for access token',
      details: 'POST /token with code_verifier for PKCE validation',
    },
    {
      step: 3,
      title: 'MCP Request Proxying',
      description: 'Gateway validates token and forwards request to MCP server',
      details: 'Injects tenant context and security headers',
    },
    {
      step: 4,
      title: 'Response Return',
      description: 'Gateway returns MCP server response to client',
      details: 'With latency metrics and security logging',
    },
  ];

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='pt-24 pb-16 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-7xl'>
          <motion.div
            initial='hidden'
            animate='visible'
            variants={stagger}
            className='text-center max-w-3xl mx-auto'
          >
            <motion.h1
              variants={fadeIn}
              className='text-4xl md:text-5xl font-bold text-wise-gray-900 mb-6'
            >
              OAuth 2.1 Gateway for{' '}
              <span className='text-wise-green-primary'>Model Context Protocol</span>
            </motion.h1>
            <motion.p variants={fadeIn} className='text-xl text-wise-gray-600 mb-8'>
              Transform your MCP ecosystem from insecure static API keys to enterprise-grade OAuth
              2.1 authentication with PKCE, Resource Indicators, and Dynamic Client Registration.
            </motion.p>
            <motion.div
              variants={fadeIn}
              className='flex flex-col sm:flex-row gap-4 justify-center'
            >
              <Link
                href='/dashboard'
                className='btn-wise-primary px-8 py-3 text-lg flex items-center justify-center space-x-2'
              >
                <span>Access Dashboard</span>
                <ArrowRight className='w-5 h-5' />
              </Link>
              <Link
                href='/docs'
                className='btn-wise-outline px-8 py-3 text-lg flex items-center justify-center space-x-2'
              >
                <FileText className='w-5 h-5' />
                <span>Documentation</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className='py-16 bg-wise-gray-50'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-4'>
              Why Choose Our OAuth 2.1 MCP Gateway?
            </h2>
            <p className='text-xl text-wise-gray-600 max-w-2xl mx-auto'>
              Secure, scalable, and compliant authentication infrastructure for your MCP servers
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-8'>
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='card-wise p-6'
              >
                <h3 className='text-xl font-semibold text-wise-gray-900 mb-3'>{benefit.title}</h3>
                <p className='text-wise-gray-600'>{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-4'>
              Enterprise-Grade OAuth 2.1 Features
            </h2>
            <p className='text-xl text-wise-gray-600 max-w-2xl mx-auto'>
              Built for security, performance, and compliance with industry standards
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
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
                <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>{feature.title}</h3>
                <p className='text-wise-gray-600'>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 bg-wise-gray-50'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-4'>
              How the OAuth 2.1 MCP Gateway Works
            </h2>
            <p className='text-xl text-wise-gray-600 max-w-2xl mx-auto'>
              Four simple steps to secure your MCP ecosystem
            </p>
          </motion.div>

          <div className='space-y-8'>
            {architecture.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='flex items-start'
              >
                <div className='flex-shrink-0 w-10 h-10 rounded-full bg-wise-green-primary text-white flex items-center justify-center font-bold mr-6 mt-1'>
                  {step.step}
                </div>
                <div className='flex-1 card-wise p-6'>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>{step.title}</h3>
                  <p className='text-wise-gray-600 mb-3'>{step.description}</p>
                  <code className='text-sm bg-wise-gray-100 p-2 rounded text-wise-gray-800 font-mono'>
                    {step.details}
                  </code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className='py-20'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center max-w-3xl mx-auto'
          >
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-4'>Seamless MCP Integration</h2>
            <p className='text-xl text-wise-gray-600 mb-8'>
              Our gateway works transparently with existing MCP clients and servers
            </p>

            <div className='flex justify-center space-x-8 mb-12'>
              <div className='text-center'>
                <div className='bg-wise-green-50 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <Code className='w-8 h-8 text-wise-green-primary' />
                </div>
                <h3 className='font-semibold text-wise-gray-900'>SDK Support</h3>
                <p className='text-wise-gray-600 text-sm mt-1'>TypeScript, Python, Java</p>
              </div>
              <div className='text-center'>
                <div className='bg-wise-green-50 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <Server className='w-8 h-8 text-wise-green-primary' />
                </div>
                <h3 className='font-semibold text-wise-gray-900'>MCP Servers</h3>
                <p className='text-wise-gray-600 text-sm mt-1'>No code changes needed</p>
              </div>
              <div className='text-center'>
                <div className='bg-wise-green-50 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <Users className='w-8 h-8 text-wise-green-primary' />
                </div>
                <h3 className='font-semibold text-wise-gray-900'>AI Clients</h3>
                <p className='text-wise-gray-600 text-sm mt-1'>Claude, ChatGPT, Cursor</p>
              </div>
            </div>

            <Link
              href='/docs/integration'
              className='btn-wise-primary px-6 py-3 inline-flex items-center space-x-2'
            >
              <span>View Integration Guide</span>
              <ArrowRight className='w-4 h-4' />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 bg-wise-green-primary'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className='text-3xl font-bold text-white mb-4'>
              Ready to Secure Your MCP Ecosystem?
            </h2>
            <p className='text-xl text-wise-green-100 mb-8 max-w-2xl mx-auto'>
              Join the growing community of developers using OAuth 2.1 MCP Gateway for
              enterprise-grade authentication
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/dashboard'
                className='bg-white text-wise-green-primary hover:bg-wise-green-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2'
              >
                <span>Access Dashboard</span>
                <ArrowRight className='w-4 h-4' />
              </Link>
              <Link
                href='/contact'
                className='bg-wise-green-600 text-white hover:bg-wise-green-700 px-8 py-3 rounded-lg font-semibold transition-colors'
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
