'use client';

import Link from 'next/link';
import { Shield, CheckCircle, FileText, Globe, Lock } from 'lucide-react';

export default function CompliancePage() {
  const regulations = [
    {
      title: 'GDPR',
      region: 'European Union',
      description: 'Full compliance with General Data Protection Regulation, including data subject rights and processing transparency.'
    },
    {
      title: 'CCPA',
      region: 'California, USA',
      description: 'Compliant with California Consumer Privacy Act, including disclosure and opt-out rights.'
    },
    {
      title: 'SOC 2 Type II',
      region: 'Global',
      description: 'Audited controls for security, availability, processing integrity, confidentiality, and privacy.'
    },
    {
      title: 'ISO 27001',
      region: 'Global',
      description: 'International standard for information security management systems.'
    },
    {
      title: 'HIPAA',
      region: 'United States',
      description: 'Ready for HIPAA compliance with Business Associate Agreements for healthcare customers.'
    },
    {
      title: 'PCI DSS',
      region: 'Global',
      description: 'Level 1 PCI DSS compliance for payment card data security.'
    }
  ];

  const features = [
    'Data residency options in multiple regions',
    'Configurable data retention policies',
    'Automated data export and deletion',
    'Comprehensive audit logs',
    'Data processing agreements (DPA)',
    'Regular third-party security audits',
    'Incident response procedures',
    'Privacy impact assessments'
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
            <h1 className='text-5xl font-bold text-wise-gray-900 mb-4'>Compliance & Regulations</h1>
            <p className='text-xl text-wise-gray-600'>
              Meeting global standards for data protection and security
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-6 mb-16'>
            {regulations.map((reg, index) => (
              <div key={index} className='card-wise p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className='text-xl font-bold text-wise-gray-900'>{reg.title}</h3>
                    <div className='flex items-center text-sm text-wise-gray-500 mt-1'>
                      <Globe className='w-4 h-4 mr-1' />
                      {reg.region}
                    </div>
                  </div>
                  <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <CheckCircle className='w-5 h-5 text-wise-green-primary' />
                  </div>
                </div>
                <p className='text-wise-gray-600'>{reg.description}</p>
              </div>
            ))}
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Compliance Features</h2>
            <div className='card-wise p-8'>
              <div className='grid md:grid-cols-2 gap-4'>
                {features.map((feature, index) => (
                  <div key={index} className='flex items-start'>
                    <CheckCircle className='w-5 h-5 text-wise-green-primary mr-3 mt-0.5 flex-shrink-0' />
                    <span className='text-wise-gray-700'>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Data Protection</h2>
            <div className='prose prose-lg max-w-none text-wise-gray-700'>
              <p>
                We implement comprehensive data protection measures to ensure compliance with global
                regulations:
              </p>
              <ul className='list-disc pl-6 space-y-3 mt-4'>
                <li>
                  <strong>Data Minimization:</strong> We only collect data necessary to provide our
                  services
                </li>
                <li>
                  <strong>Purpose Limitation:</strong> Data is used only for specified, legitimate purposes
                </li>
                <li>
                  <strong>Storage Limitation:</strong> Data is retained only as long as necessary
                </li>
                <li>
                  <strong>Data Subject Rights:</strong> Easy access, correction, and deletion of personal
                  data
                </li>
                <li>
                  <strong>Security Safeguards:</strong> Technical and organizational measures protect all
                  data
                </li>
                <li>
                  <strong>Breach Notification:</strong> Timely notification procedures for data breaches
                </li>
              </ul>
            </div>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>International Data Transfers</h2>
            <div className='card-wise p-8'>
              <p className='text-wise-gray-700 mb-4'>
                We ensure appropriate safeguards for international data transfers:
              </p>
              <ul className='space-y-3'>
                <li className='flex items-start'>
                  <CheckCircle className='w-5 h-5 text-wise-green-primary mr-3 mt-0.5 flex-shrink-0' />
                  <span className='text-wise-gray-700'>
                    Standard Contractual Clauses (SCCs) for EU data transfers
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='w-5 h-5 text-wise-green-primary mr-3 mt-0.5 flex-shrink-0' />
                  <span className='text-wise-gray-700'>
                    Data residency options to keep data within specific regions
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='w-5 h-5 text-wise-green-primary mr-3 mt-0.5 flex-shrink-0' />
                  <span className='text-wise-gray-700'>
                    Regular assessments of data transfer mechanisms
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            <div className='bg-wise-green-50 rounded-lg p-8 text-center'>
              <FileText className='w-12 h-12 text-wise-green-primary mx-auto mb-4' />
              <h3 className='text-xl font-bold text-wise-gray-900 mb-2'>
                Compliance Documentation
              </h3>
              <p className='text-wise-gray-600 mb-4'>
                Request our compliance documentation package
              </p>
              <Link href='/contact?subject=compliance' className='btn-wise-primary px-6 py-2'>
                Request Docs
              </Link>
            </div>

            <div className='bg-wise-gray-50 rounded-lg p-8 text-center'>
              <Lock className='w-12 h-12 text-wise-gray-600 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-wise-gray-900 mb-2'>
                Data Processing Agreement
              </h3>
              <p className='text-wise-gray-600 mb-4'>
                Download our standard DPA for your records
              </p>
              <Link href='/contact?subject=dpa' className='btn-wise-secondary px-6 py-2'>
                Request DPA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
