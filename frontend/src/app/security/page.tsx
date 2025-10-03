'use client';

import Link from 'next/link';
import { Shield, Lock, Key, Eye, FileText, Award, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256).'
    },
    {
      icon: Key,
      title: 'Hardware Security Modules',
      description: 'Sensitive keys and tokens are protected using FIPS 140-2 certified HSMs.'
    },
    {
      icon: Eye,
      title: 'Audit Logging',
      description: 'Complete audit trail of all authentication events and API calls.'
    },
    {
      icon: Shield,
      title: 'Zero Trust Architecture',
      description: 'Every request is verified and authenticated with no implicit trust.'
    }
  ];

  const certifications = [
    'SOC 2 Type II',
    'ISO 27001',
    'GDPR Compliant',
    'CCPA Compliant',
    'HIPAA Ready',
    'PCI DSS Level 1'
  ];

  return (
    <div className='min-h-screen bg-white'>
      <nav className='fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-wise-gray-200 z-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                <Shield className='w-5 h-5 text-white' />
              </div>
              <span className='font-bold text-xl text-wise-gray-900'>MCP Gateway</span>
            </Link>
            <Link href='/dashboard' className='btn-wise-primary px-6 py-2'>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className='pt-24 pb-16 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-5xl'>
          <div className='text-center mb-12'>
            <h1 className='text-5xl font-bold text-wise-gray-900 mb-4'>Security at MCP Gateway</h1>
            <p className='text-xl text-wise-gray-600'>
              Enterprise-grade security designed into every layer of our infrastructure
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-8 mb-16'>
            {securityFeatures.map((feature, index) => (
              <div key={index} className='card-wise p-6'>
                <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                  <feature.icon className='w-6 h-6 text-wise-green-primary' />
                </div>
                <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>{feature.title}</h3>
                <p className='text-wise-gray-600'>{feature.description}</p>
              </div>
            ))}
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>OAuth 2.1 Compliance</h2>
            <div className='card-wise p-8'>
              <p className='text-wise-gray-700 mb-6'>
                MCP Gateway is fully compliant with the OAuth 2.1 specification, implementing all required
                security enhancements:
              </p>
              <ul className='space-y-3'>
                {[
                  'PKCE (Proof Key for Code Exchange) required for all flows',
                  'Token binding to prevent token theft and replay attacks',
                  'DPoP (Demonstrating Proof-of-Possession) support',
                  'Automatic refresh token rotation',
                  'Strict redirect URI validation',
                  'Rate limiting and abuse prevention'
                ].map((item, index) => (
                  <li key={index} className='flex items-start'>
                    <CheckCircle className='w-5 h-5 text-wise-green-primary mr-3 mt-0.5 flex-shrink-0' />
                    <span className='text-wise-gray-700'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Infrastructure Security</h2>
            <div className='prose prose-lg max-w-none text-wise-gray-700'>
              <ul className='list-disc pl-6 space-y-3'>
                <li>Built on Cloudflare Workers for distributed DDoS protection</li>
                <li>Multi-region deployment with automatic failover</li>
                <li>Regular penetration testing by third-party security firms</li>
                <li>24/7 security monitoring and incident response</li>
                <li>Automated vulnerability scanning and patching</li>
                <li>Immutable infrastructure with version control</li>
              </ul>
            </div>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>
              Certifications & Compliance
            </h2>
            <div className='grid md:grid-cols-3 gap-4'>
              {certifications.map((cert, index) => (
                <div key={index} className='card-wise p-6 text-center'>
                  <Award className='w-8 h-8 text-wise-green-primary mx-auto mb-3' />
                  <p className='font-semibold text-wise-gray-900'>{cert}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Responsible Disclosure</h2>
            <div className='card-wise p-8'>
              <p className='text-wise-gray-700 mb-4'>
                We take security vulnerabilities seriously. If you discover a security issue, please:
              </p>
              <ul className='list-decimal pl-6 space-y-2 text-wise-gray-700 mb-6'>
                <li>Email us at security@mcpgateway.com with details</li>
                <li>Allow us reasonable time to address the issue before public disclosure</li>
                <li>Do not exploit the vulnerability or disclose it publicly</li>
              </ul>
              <p className='text-wise-gray-700'>
                We offer rewards for valid security reports through our bug bounty program.
              </p>
            </div>
          </div>

          <div className='bg-wise-green-50 rounded-lg p-8 text-center'>
            <FileText className='w-12 h-12 text-wise-green-primary mx-auto mb-4' />
            <h3 className='text-2xl font-bold text-wise-gray-900 mb-2'>Security Documentation</h3>
            <p className='text-wise-gray-600 mb-6'>
              Need detailed security documentation for compliance or vendor review?
            </p>
            <Link href='/contact?subject=security' className='btn-wise-primary px-8 py-3'>
              Request Security Pack
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
