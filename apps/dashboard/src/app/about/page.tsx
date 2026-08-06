'use client';

import Link from 'next/link';
import { Shield, Target, Users, Heart, Rocket } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'We prioritize security in everything we build, from code to infrastructure.'
    },
    {
      icon: Target,
      title: 'Developer Focused',
      description: 'Built by developers, for developers. We understand your needs and challenges.'
    },
    {
      icon: Users,
      title: 'Customer Success',
      description: 'Your success is our success. We are committed to helping you achieve your goals.'
    },
    {
      icon: Heart,
      title: 'Open & Transparent',
      description: 'We believe in transparency, honesty, and open communication with our users.'
    }
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
        <div className='container mx-auto max-w-4xl'>
          <h1 className='text-5xl font-bold text-wise-gray-900 mb-6'>About MCP Gateway</h1>
          <p className='text-xl text-wise-gray-600 mb-12'>
            We're building the future of secure authentication for Model Context Protocol servers.
          </p>

          <div className='prose prose-lg max-w-none text-wise-gray-700 space-y-6 mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900'>Our Mission</h2>
            <p>
              MCP Gateway was founded with a simple mission: make OAuth 2.1 authentication accessible,
              secure, and easy to implement for Model Context Protocol servers. We believe that security
              shouldn't be complicated, and developers shouldn't have to choose between security and
              ease of use.
            </p>

            <h2 className='text-3xl font-bold text-wise-gray-900 mt-12'>Our Story</h2>
            <p>
              Founded in 2024, MCP Gateway emerged from the need for a modern, secure authentication
              solution specifically designed for MCP servers. Our team of security experts and
              developers recognized the challenges of implementing OAuth 2.1 correctly and decided to
              build a solution that handles the complexity for you.
            </p>
          </div>

          <div className='mb-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-8'>Our Values</h2>
            <div className='grid md:grid-cols-2 gap-6'>
              {values.map((value, index) => (
                <div key={index} className='card-wise p-6'>
                  <div className='w-12 h-12 bg-wise-green-50 rounded-lg flex items-center justify-center mb-4'>
                    <value.icon className='w-6 h-6 text-wise-green-primary' />
                  </div>
                  <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>{value.title}</h3>
                  <p className='text-wise-gray-600'>{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-wise-green-50 rounded-lg p-8 text-center'>
            <Rocket className='w-12 h-12 text-wise-green-primary mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-wise-gray-900 mb-4'>Join Our Team</h2>
            <p className='text-wise-gray-600 mb-6'>
              We're always looking for talented people to join our mission.
            </p>
            <Link href='/careers' className='btn-wise-primary px-8 py-3'>
              View Open Positions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
