'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className='text-5xl font-bold text-wise-gray-900 mb-4'>Terms of Service</h1>
          <p className='text-wise-gray-600 mb-12'>Last updated: January 2025</p>

          <div className='prose prose-lg max-w-none text-wise-gray-700 space-y-8'>
            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>1. Acceptance of Terms</h2>
              <p>
                By accessing or using MCP Gateway ("Service"), you agree to be bound by these Terms of
                Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>2. Description of Service</h2>
              <p>
                MCP Gateway provides OAuth 2.1 authentication infrastructure for Model Context Protocol
                servers. The Service includes API access, authentication flows, token management, and
                related features as described in our documentation.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>3. Account Registration</h2>
              <p>
                You must provide accurate, complete information when creating an account. You are
                responsible for:
              </p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Ensuring your account information is current and accurate</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malicious code or interfere with the Service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service for illegal authentication or fraud</li>
                <li>Exceed rate limits or abuse the API</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>5. Subscription and Payment</h2>
              <p>
                Paid plans are billed in advance on a monthly or annual basis. You agree to:
              </p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Provide accurate payment information</li>
                <li>Pay all fees when due</li>
                <li>Accept automatic renewals unless cancelled</li>
                <li>Pay any applicable taxes</li>
              </ul>
              <p className='mt-4'>
                We reserve the right to change pricing with 30 days' notice. You may cancel at any time,
                effective at the end of your billing period.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>6. Service Level Agreement</h2>
              <p>
                We strive to maintain 99.9% uptime for paid plans (99.99% for Enterprise). See our SLA
                document for details on uptime credits and exclusions.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>7. Data and Privacy</h2>
              <p>
                Our collection and use of personal information is described in our Privacy Policy. You
                retain ownership of your data and grant us a license to process it to provide the Service.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>8. Intellectual Property</h2>
              <p>
                The Service and its content are protected by copyright, trademark, and other laws. You
                may not copy, modify, or reverse engineer any part of the Service without permission.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>9. Termination</h2>
              <p>
                We may suspend or terminate your account if you violate these Terms. Upon termination:
              </p>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Your access to the Service will cease immediately</li>
                <li>You remain liable for all outstanding fees</li>
                <li>We may delete your data after 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>10. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES,
                EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID
                IN THE LAST 12 MONTHS.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>12. Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from any claims arising from your use of the
                Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>13. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Material changes will be notified via email or
                Service announcement. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of California, USA, without regard to conflict of law
                principles. Any disputes shall be resolved in San Francisco County courts.
              </p>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-wise-gray-900'>15. Contact</h2>
              <p>
                Questions about these Terms? Contact us at:
              </p>
              <ul className='list-none space-y-2'>
                <li>Email: legal@mcpgateway.com</li>
                <li>Address: MCP Gateway Inc., San Francisco, CA</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
