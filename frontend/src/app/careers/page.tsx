'use client';

import Link from 'next/link';
import { Shield, MapPin, Clock, Briefcase, ArrowRight } from 'lucide-react';

export default function CareersPage() {
  const openings = [
    {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build scalable authentication infrastructure on Cloudflare Workers.'
    },
    {
      title: 'Security Engineer',
      department: 'Security',
      location: 'Remote',
      type: 'Full-time',
      description: 'Ensure our platform meets the highest security standards.'
    },
    {
      title: 'Developer Relations Engineer',
      department: 'Developer Experience',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help developers succeed with our platform through docs, demos, and support.'
    }
  ];

  const benefits = [
    'Competitive salary and equity',
    'Health, dental, and vision insurance',
    'Unlimited PTO',
    'Remote-first culture',
    'Latest tech equipment',
    'Learning and development budget',
    'Home office stipend',
    'Flexible working hours'
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
            <h1 className='text-5xl font-bold text-wise-gray-900 mb-4'>Join Our Team</h1>
            <p className='text-xl text-wise-gray-600'>
              Help us build the future of secure authentication
            </p>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Why MCP Gateway?</h2>
            <div className='grid md:grid-cols-2 gap-4'>
              {benefits.map((benefit, index) => (
                <div key={index} className='flex items-center space-x-3'>
                  <div className='w-6 h-6 bg-wise-green-50 rounded-full flex items-center justify-center flex-shrink-0'>
                    <div className='w-2 h-2 bg-wise-green-primary rounded-full' />
                  </div>
                  <span className='text-wise-gray-700'>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-6'>Open Positions</h2>
            <div className='space-y-4'>
              {openings.map((job, index) => (
                <div key={index} className='card-wise p-6 hover:shadow-wise-hover transition-shadow'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>{job.title}</h3>
                      <p className='text-wise-gray-600 mb-4'>{job.description}</p>
                      <div className='flex flex-wrap gap-4 text-sm text-wise-gray-500'>
                        <div className='flex items-center'>
                          <Briefcase className='w-4 h-4 mr-2' />
                          {job.department}
                        </div>
                        <div className='flex items-center'>
                          <MapPin className='w-4 h-4 mr-2' />
                          {job.location}
                        </div>
                        <div className='flex items-center'>
                          <Clock className='w-4 h-4 mr-2' />
                          {job.type}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/contact?subject=career&position=${encodeURIComponent(job.title)}`}
                      className='btn-wise-primary px-4 py-2 ml-4 flex items-center whitespace-nowrap'
                    >
                      Apply
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-12 bg-wise-gray-50 rounded-lg p-8 text-center'>
            <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>
              Don't see a perfect fit?
            </h3>
            <p className='text-wise-gray-600 mb-4'>
              We're always interested in hearing from talented people. Send us your resume!
            </p>
            <Link href='/contact?subject=career' className='btn-wise-secondary px-6 py-3'>
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
