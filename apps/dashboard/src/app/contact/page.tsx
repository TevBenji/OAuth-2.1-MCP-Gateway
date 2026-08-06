'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Shield,
  Mail,
  Send,
  Check,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Code,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: 'general',
        message: '',
      });

      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again or email us directly.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@mcpgateway.com',
      link: 'mailto:support@mcpgateway.com',
    },
    {
      icon: MessageSquare,
      label: 'Sales',
      value: 'sales@mcpgateway.com',
      link: 'mailto:sales@mcpgateway.com',
    },
    {
      icon: HelpCircle,
      label: 'Support',
      value: 'help@mcpgateway.com',
      link: 'mailto:help@mcpgateway.com',
    },
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

      <div className='pt-24 pb-16 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-7xl'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl lg:text-5xl font-bold text-wise-gray-900 mb-4'>
              Get in Touch
            </h1>
            <p className='text-xl text-wise-gray-600 max-w-2xl mx-auto'>
              Have questions about MCP Gateway? We're here to help. Send us a message and we'll
              respond as soon as possible.
            </p>
          </div>

          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Contact Form */}
            <div className='lg:col-span-2'>
              <div className='card-wise p-8'>
                <h2 className='text-2xl font-bold text-wise-gray-900 mb-6'>Send us a message</h2>

                {status === 'success' && (
                  <div className='mb-6 bg-wise-green-50 border border-wise-green-200 rounded-lg p-4 flex items-start'>
                    <Check className='w-5 h-5 text-wise-green-600 mr-3 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-sm font-medium text-wise-green-900 mb-1'>Message sent!</p>
                      <p className='text-sm text-wise-green-800'>
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start'>
                    <AlertCircle className='w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-sm font-medium text-red-900 mb-1'>Error sending message</p>
                      <p className='text-sm text-red-800'>{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid md:grid-cols-2 gap-6'>
                    <div>
                      <label htmlFor='name' className='block text-sm font-medium text-wise-gray-700 mb-2'>
                        Full Name *
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className='w-full px-4 py-3 border border-wise-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:border-wise-green-primary'
                        placeholder='John Doe'
                      />
                    </div>

                    <div>
                      <label htmlFor='email' className='block text-sm font-medium text-wise-gray-700 mb-2'>
                        Email Address *
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className='w-full px-4 py-3 border border-wise-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:border-wise-green-primary'
                        placeholder='john@example.com'
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor='company' className='block text-sm font-medium text-wise-gray-700 mb-2'>
                      Company (Optional)
                    </label>
                    <input
                      type='text'
                      id='company'
                      name='company'
                      value={formData.company}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-wise-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:border-wise-green-primary'
                      placeholder='Acme Inc.'
                    />
                  </div>

                  <div>
                    <label htmlFor='subject' className='block text-sm font-medium text-wise-gray-700 mb-2'>
                      Subject *
                    </label>
                    <select
                      id='subject'
                      name='subject'
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className='w-full px-4 py-3 border border-wise-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:border-wise-green-primary'
                    >
                      <option value='general'>General Inquiry</option>
                      <option value='sales'>Sales</option>
                      <option value='support'>Technical Support</option>
                      <option value='billing'>Billing Question</option>
                      <option value='partnership'>Partnership Opportunity</option>
                      <option value='security'>Security Concern</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor='message' className='block text-sm font-medium text-wise-gray-700 mb-2'>
                      Message *
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className='w-full px-4 py-3 border border-wise-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:border-wise-green-primary resize-none'
                      placeholder='Tell us how we can help...'
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={status === 'loading'}
                    className='w-full btn-wise-primary py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {status === 'loading' ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className='w-5 h-5 mr-2' />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className='space-y-6'>
              <div className='card-wise p-6'>
                <h3 className='text-lg font-semibold text-wise-gray-900 mb-4'>Contact Information</h3>
                <div className='space-y-4'>
                  {contactInfo.map((info) => (
                    <a
                      key={info.label}
                      href={info.link}
                      className='flex items-start p-3 rounded-lg hover:bg-wise-gray-50 transition-colors group'
                    >
                      <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-wise-green-100 transition-colors'>
                        <info.icon className='w-5 h-5 text-wise-green-primary' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-wise-gray-700'>{info.label}</p>
                        <p className='text-sm text-wise-gray-600 group-hover:text-wise-green-primary transition-colors'>
                          {info.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className='card-wise p-6'>
                <h3 className='text-lg font-semibold text-wise-gray-900 mb-4'>Office Hours</h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-wise-gray-600'>Monday - Friday</span>
                    <span className='font-medium text-wise-gray-900'>9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-wise-gray-600'>Saturday - Sunday</span>
                    <span className='font-medium text-wise-gray-900'>Closed</span>
                  </div>
                </div>
              </div>

              <div className='card-wise p-6 bg-wise-green-50 border-wise-green-200'>
                <div className='flex items-start'>
                  <div className='w-10 h-10 bg-wise-green-primary rounded-lg flex items-center justify-center mr-3 flex-shrink-0'>
                    <Code className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-wise-gray-900 mb-2'>
                      Need Technical Support?
                    </h3>
                    <p className='text-sm text-wise-gray-600 mb-3'>
                      Check out our documentation or contact our technical support team.
                    </p>
                    <Link
                      href='/docs'
                      className='text-sm font-medium text-wise-green-primary hover:text-wise-green-600'
                    >
                      View Documentation →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className='mt-16'>
            <h2 className='text-3xl font-bold text-wise-gray-900 mb-8 text-center'>
              Frequently Asked Questions
            </h2>
            <div className='grid md:grid-cols-2 gap-6 max-w-5xl mx-auto'>
              <div className='card-wise p-6'>
                <h3 className='font-semibold text-wise-gray-900 mb-2'>
                  What is your response time for support requests?
                </h3>
                <p className='text-sm text-wise-gray-600'>
                  We typically respond to all inquiries within 24 hours during business days. For
                  urgent technical issues, paid plan customers can access priority support with
                  response times under 4 hours.
                </p>
              </div>

              <div className='card-wise p-6'>
                <h3 className='font-semibold text-wise-gray-900 mb-2'>
                  Do you offer enterprise support?
                </h3>
                <p className='text-sm text-wise-gray-600'>
                  Yes! Enterprise customers get dedicated support channels, custom SLAs, and a
                  dedicated account manager. Contact our sales team to learn more.
                </p>
              </div>

              <div className='card-wise p-6'>
                <h3 className='font-semibold text-wise-gray-900 mb-2'>
                  How can I report a security vulnerability?
                </h3>
                <p className='text-sm text-wise-gray-600'>
                  Please report security concerns to security@mcpgateway.com. We take all security
                  reports seriously and will respond within 24 hours.
                </p>
              </div>

              <div className='card-wise p-6'>
                <h3 className='font-semibold text-wise-gray-900 mb-2'>
                  Where can I find your API documentation?
                </h3>
                <p className='text-sm text-wise-gray-600'>
                  Our complete API documentation is available at{' '}
                  <Link href='/docs' className='text-wise-green-primary hover:text-wise-green-600'>
                    docs.mcpgateway.com
                  </Link>{' '}
                  with examples, code snippets, and integration guides.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
