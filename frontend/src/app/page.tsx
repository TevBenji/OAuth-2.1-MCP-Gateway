'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Lock,
  Code,
  Globe,
  Users,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  BarChart3,
  Key,
  Server,
  CreditCard,
  FileText,
  Settings,
  TrendingUp,
  Star,
  Award,
  Sparkles,
} from 'lucide-react';

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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'OAuth 2.1 compliant with PKCE, DPoP, and token binding for maximum security.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built on Cloudflare Workers for global edge performance and 99.99% uptime.',
    },
    {
      icon: Lock,
      title: 'Zero Trust Architecture',
      description: 'Every request is verified, encrypted, and audited with complete transparency.',
    },
    {
      icon: Code,
      title: 'MCP Native',
      description: 'Purpose-built for Model Context Protocol with seamless integration.',
    },
    {
      icon: Globe,
      title: 'Multi-Provider Support',
      description: 'Connect Google, GitHub, Microsoft, and custom OAuth providers effortlessly.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Manage teams, projects, and permissions with granular access control.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out MCP Gateway',
      features: [
        '1,000 API calls/month',
        '1 project',
        'Community support',
        'Basic analytics',
        'Standard OAuth providers',
      ],
      buttonText: 'Start Free',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'For developers and small teams',
      features: [
        '10,000 API calls/month',
        '5 projects',
        'Email support',
        'Advanced analytics',
        'All OAuth providers',
        'Custom domains',
        'API key management',
      ],
      buttonText: 'Start Trial',
      buttonStyle: 'btn-wise-primary',
      popular: true,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '100,000 API calls/month',
        'Unlimited projects',
        'Priority support',
        'Real-time monitoring',
        'Custom OAuth providers',
        'SSO integration',
        'Audit logs',
        'SLA guarantee',
      ],
      buttonText: 'Start Trial',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: [
        'Unlimited API calls',
        'Dedicated support',
        'Custom SLA',
        'On-premise deployment',
        'Compliance reports',
        'Custom integrations',
        'Training & onboarding',
        'Dedicated account manager',
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
    },
  ];

  return (
    <div className='min-h-screen bg-white'>
      {/* Navigation */}
      <nav className='fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-wise-gray-200 z-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                  <Shield className='w-5 h-5 text-white' />
                </div>
                <span className='font-bold text-xl text-wise-gray-900'>MCP Gateway</span>
              </Link>
              <div className='hidden md:flex items-center ml-10 space-x-8'>
                <Link
                  href='#features'
                  className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'
                >
                  Features
                </Link>
                <Link
                  href='#pricing'
                  className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'
                >
                  Pricing
                </Link>
                <Link
                  href='/docs'
                  className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'
                >
                  Documentation
                </Link>
                <Link
                  href='/general'
                  className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'
                >
                  How It Works
                </Link>
              </div>
            </div>
            <div className='hidden md:flex items-center space-x-4'>
              {isSignedIn ? (
                <Link
                  href='/dashboard'
                  className='px-4 py-2 text-wise-green-primary hover:bg-wise-green-50 rounded-lg transition-colors'
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <SignInButton mode='modal'>
                    <button className='px-4 py-2 text-wise-gray-700 hover:text-wise-green-primary transition-colors'>
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode='modal'>
                    <button className='btn-wise-primary px-6 py-2'>Get Started</button>
                  </SignUpButton>
                </>
              )}
            </div>
            <div className='md:hidden'>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='p-2 rounded-lg hover:bg-wise-gray-50'
              >
                {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden bg-white border-t border-wise-gray-200'
          >
            <div className='container mx-auto px-4 py-4 space-y-2'>
              <Link
                href='#features'
                className='block px-4 py-2 text-wise-gray-600 hover:bg-wise-gray-50 rounded-lg'
              >
                Features
              </Link>
              <Link
                href='#pricing'
                className='block px-4 py-2 text-wise-gray-600 hover:bg-wise-gray-50 rounded-lg'
              >
                Pricing
              </Link>
              <Link
                href='/docs'
                className='block px-4 py-2 text-wise-gray-600 hover:bg-wise-gray-50 rounded-lg'
              >
                Documentation
              </Link>
              <Link
                href='/general'
                className='block px-4 py-2 text-wise-gray-600 hover:bg-wise-gray-50 rounded-lg'
              >
                How It Works
              </Link>
              <div className='pt-4 border-t border-wise-gray-200 space-y-2'>
                {isSignedIn ? (
                  <Link href='/dashboard' className='block btn-wise-primary text-center py-2'>
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <SignInButton mode='modal'>
                      <button className='w-full btn-wise-secondary py-2'>Sign In</button>
                    </SignInButton>
                    <SignUpButton mode='modal'>
                      <button className='w-full btn-wise-primary py-2'>Get Started</button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto'>
          <motion.div
            initial='hidden'
            animate='visible'
            variants={stagger}
            className='text-center max-w-4xl mx-auto'
          >
            <motion.div
              variants={fadeIn}
              className='inline-flex items-center space-x-2 bg-wise-green-50 text-wise-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6'
            >
              <Sparkles className='w-4 h-4' />
              <span>Now with OAuth 2.1 and PKCE support</span>
            </motion.div>
            <motion.h1
              variants={fadeIn}
              className='text-5xl lg:text-6xl font-bold text-wise-gray-900 mb-6'
            >
              Secure OAuth Gateway for{' '}
              <span className='text-wise-green-primary'>Model Context Protocol</span>
            </motion.h1>
            <motion.p variants={fadeIn} className='text-xl text-wise-gray-600 mb-8'>
              Enterprise-grade authentication infrastructure for MCP servers. Connect any OAuth
              provider, manage tokens securely, and scale globally with confidence.
            </motion.p>
            <motion.div
              variants={fadeIn}
              className='flex flex-col sm:flex-row gap-4 justify-center'
            >
              <SignUpButton mode='modal'>
                <button className='btn-wise-primary px-8 py-4 text-lg flex items-center justify-center space-x-2'>
                  <span>Start Free Trial</span>
                  <ArrowRight className='w-5 h-5' />
                </button>
              </SignUpButton>
              <Link
                href='/docs'
                className='btn-wise-outline px-8 py-4 text-lg flex items-center justify-center space-x-2'
              >
                <Code className='w-5 h-5' />
                <span>View Documentation</span>
              </Link>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className='mt-8 flex items-center justify-center space-x-8 text-wise-gray-500'
            >
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-wise-green-primary' />
                <span className='text-sm'>No credit card required</span>
              </div>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-wise-green-primary' />
                <span className='text-sm'>14-day free trial</span>
              </div>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-wise-green-primary' />
                <span className='text-sm'>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='mt-20 grid grid-cols-2 md:grid-cols-4 gap-8'
          >
            <div className='text-center'>
              <div className='text-4xl font-bold text-wise-green-primary'>99.99%</div>
              <div className='text-wise-gray-600 mt-2'>Uptime SLA</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-wise-green-primary'>&lt;50ms</div>
              <div className='text-wise-gray-600 mt-2'>Global Latency</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-wise-green-primary'>10M+</div>
              <div className='text-wise-gray-600 mt-2'>API Calls Daily</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-wise-green-primary'>SOC2</div>
              <div className='text-wise-gray-600 mt-2'>Compliant</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-20 bg-wise-gray-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>
              Everything you need for secure MCP authentication
            </h2>
            <p className='text-xl text-wise-gray-600'>
              Built by developers, for developers. No compromises on security or performance.
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

      {/* Pricing Section */}
      <section id='pricing' className='py-20'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>
              Simple, transparent pricing
            </h2>
            <p className='text-xl text-wise-gray-600'>
              Choose the plan that fits your needs. Scale as you grow.
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`card-wise p-6 relative ${plan.popular ? 'ring-2 ring-wise-green-primary' : ''}`}
              >
                {plan.popular && (
                  <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                    <span className='bg-wise-green-primary text-white px-3 py-1 rounded-full text-xs font-medium'>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className='mb-6'>
                  <h3 className='text-2xl font-bold text-wise-gray-900 mb-2'>{plan.name}</h3>
                  <div className='flex items-baseline'>
                    <span className='text-4xl font-bold text-wise-gray-900'>{plan.price}</span>
                    {plan.period && <span className='text-wise-gray-600 ml-1'>{plan.period}</span>}
                  </div>
                  <p className='text-wise-gray-600 mt-2'>{plan.description}</p>
                </div>
                <ul className='space-y-3 mb-6'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start'>
                      <CheckCircle className='w-5 h-5 text-wise-green-primary mr-2 mt-0.5 flex-shrink-0' />
                      <span className='text-wise-gray-700'>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full ${plan.buttonStyle} py-3`}>{plan.buttonText}</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 bg-wise-gray-50'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>Get started in minutes</h2>
            <p className='text-xl text-wise-gray-600'>
              Three simple steps to secure your MCP servers
            </p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className='text-center'
            >
              <div className='w-16 h-16 bg-wise-green-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold'>
                1
              </div>
              <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>Sign Up</h3>
              <p className='text-wise-gray-600'>
                Create your account and choose a plan that fits your needs
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className='text-center'
            >
              <div className='w-16 h-16 bg-wise-green-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold'>
                2
              </div>
              <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>Configure OAuth</h3>
              <p className='text-wise-gray-600'>
                Connect your OAuth providers and configure your MCP servers
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className='text-center'
            >
              <div className='w-16 h-16 bg-wise-green-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold'>
                3
              </div>
              <h3 className='text-xl font-semibold text-wise-gray-900 mb-2'>
                Start Authenticating
              </h3>
              <p className='text-wise-gray-600'>
                Use our SDKs or API to authenticate users securely
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-wise-green-primary'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className='text-4xl font-bold text-white mb-4'>
              Ready to secure your MCP servers?
            </h2>
            <p className='text-xl text-wise-green-100 mb-8'>
              Join thousands of developers using MCP Gateway for secure authentication
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <SignUpButton mode='modal'>
                <button className='bg-white text-wise-green-primary hover:bg-wise-green-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2'>
                  <span>Start Free Trial</span>
                  <ArrowRight className='w-5 h-5' />
                </button>
              </SignUpButton>
              <Link
                href='/contact'
                className='bg-wise-green-600 text-white hover:bg-wise-green-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors'
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-wise-gray-900 text-white py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid md:grid-cols-4 gap-8 mb-8'>
            <div>
              <div className='flex items-center space-x-2 mb-4'>
                <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                  <Shield className='w-5 h-5 text-white' />
                </div>
                <span className='font-bold text-xl'>MCP Gateway</span>
              </div>
              <p className='text-wise-gray-400'>
                Enterprise-grade OAuth 2.1 authentication for Model Context Protocol servers.
              </p>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>Product</h4>
              <ul className='space-y-2 text-wise-gray-400'>
                <li>
                  <Link
                    href='/features'
                    className='hover:text-wise-green-primary transition-colors'
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link href='/pricing' className='hover:text-wise-green-primary transition-colors'>
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href='/docs' className='hover:text-wise-green-primary transition-colors'>
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href='/api' className='hover:text-wise-green-primary transition-colors'>
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>Company</h4>
              <ul className='space-y-2 text-wise-gray-400'>
                <li>
                  <Link href='/about' className='hover:text-wise-green-primary transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link href='/careers' className='hover:text-wise-green-primary transition-colors'>
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href='/contact' className='hover:text-wise-green-primary transition-colors'>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>Legal</h4>
              <ul className='space-y-2 text-wise-gray-400'>
                <li>
                  <Link href='/privacy' className='hover:text-wise-green-primary transition-colors'>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href='/terms' className='hover:text-wise-green-primary transition-colors'>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href='/security'
                    className='hover:text-wise-green-primary transition-colors'
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href='/compliance'
                    className='hover:text-wise-green-primary transition-colors'
                  >
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-wise-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center'>
            <p className='text-wise-gray-400'>© 2024 MCP Gateway. All rights reserved.</p>
            <div className='flex space-x-4 mt-4 md:mt-0'>
              <a
                href='https://github.com'
                className='text-wise-gray-400 hover:text-wise-green-primary transition-colors'
              >
                <Github className='w-5 h-5' />
              </a>
              <a
                href='https://twitter.com'
                className='text-wise-gray-400 hover:text-wise-green-primary transition-colors'
              >
                <Twitter className='w-5 h-5' />
              </a>
              <a
                href='https://linkedin.com'
                className='text-wise-gray-400 hover:text-wise-green-primary transition-colors'
              >
                <Linkedin className='w-5 h-5' />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
