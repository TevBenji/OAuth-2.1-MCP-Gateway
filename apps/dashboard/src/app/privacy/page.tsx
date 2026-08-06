'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
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
        <div className='container mx-auto max-w-4xl'>
          <h1 className='text-5xl font-bold text-wise-gray-900 mb-4'>Privacy Policy</h1>
          <p className='text-wise-gray-600 mb-12'>Last updated: January 2025</p>

          <div className='prose prose-lg max-w-none text-wise-gray-700 space-y-8'>
            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Introduction</h2>
              <p>
                MCP Gateway ("we," "our," or "us") is committed to protecting your privacy. This Privacy
                Policy explains how we collect, use, disclose, and safeguard your information when you use
                our OAuth 2.1 authentication gateway service.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Information We Collect</h2>
              <h3 className='text-xl font-semibold text-wise-gray-900 mt-6'>Account Information</h3>
              <p>
                When you create an account, we collect your name, email address, company name, and
                payment information.
              </p>
              <h3 className='text-xl font-semibold text-wise-gray-900 mt-6'>Usage Data</h3>
              <p>
                We collect information about how you use our service, including API calls, authentication
                attempts, IP addresses, browser type, and timestamps.
              </p>
              <h3 className='text-xl font-semibold text-wise-gray-900 mt-6'>OAuth Provider Data</h3>
              <p>
                When you connect OAuth providers, we store provider configuration, access tokens (encrypted),
                refresh tokens (encrypted), and token metadata.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>How We Use Your Information</h2>
              <ul className='list-disc pl-6 space-y-2'>
                <li>To provide and maintain our authentication service</li>
                <li>To process your transactions and send notifications</li>
                <li>To monitor and analyze usage patterns and improve our service</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>All data is encrypted in transit using TLS 1.3</li>
                <li>Sensitive data is encrypted at rest using AES-256</li>
                <li>Access tokens are encrypted using hardware security modules (HSM)</li>
                <li>We conduct regular security audits and penetration testing</li>
                <li>Our infrastructure is SOC 2 Type II certified</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to provide our services and comply
                with legal obligations. You can request deletion of your account and data at any time.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Your Rights</h2>
              <p>You have the right to:</p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Third-Party Services</h2>
              <p>
                We use trusted third-party services for infrastructure (Cloudflare, Neon), analytics,
                and payment processing (Stripe). These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>International Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Children's Privacy</h2>
              <p>
                Our service is not directed to individuals under 18. We do not knowingly collect personal
                information from children.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by email or through our service.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul className='list-none space-y-2'>
                <li>Email: privacy@mcpgateway.com</li>
                <li>Address: MCP Gateway Inc., San Francisco, CA</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
