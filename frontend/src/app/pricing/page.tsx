'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const pricingPlans = [
    {
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      period: 'forever',
      description: 'Perfect for trying out MCP Gateway',
      features: [
        '1,000 API calls/month',
        '1 project',
        'Community support',
        'Basic analytics',
        'Standard OAuth providers',
        'Email notifications',
      ],
      buttonText: 'Start Free',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
    },
    {
      name: 'Starter',
      monthlyPrice: '$29',
      yearlyPrice: '$290',
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
        'Webhook support',
      ],
      buttonText: 'Start Trial',
      buttonStyle: 'btn-wise-primary',
      popular: true,
      savings: 17,
    },
    {
      name: 'Professional',
      monthlyPrice: '$99',
      yearlyPrice: '$990',
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
        'SLA guarantee (99.9%)',
        'Advanced security features',
      ],
      buttonText: 'Start Trial',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
      savings: 17,
    },
    {
      name: 'Enterprise',
      monthlyPrice: 'Custom',
      yearlyPrice: 'Custom',
      period: '',
      description: 'For large organizations',
      features: [
        'Unlimited API calls',
        'Dedicated support',
        'Custom SLA (99.99%)',
        'On-premise deployment',
        'Compliance reports',
        'Custom integrations',
        'Training & onboarding',
        'Dedicated account manager',
        'White-label options',
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'btn-wise-secondary',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we will prorate your billing accordingly.'
    },
    {
      question: 'What happens if I exceed my API call limit?',
      answer: 'We will send you notifications at 80% and 100% usage. You can upgrade anytime or purchase additional API call packs. We will not cut off your service immediately.'
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required. You can cancel anytime during the trial period.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and for Enterprise customers, we offer invoice billing with NET30 terms.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees for any plan. You only pay the monthly or annual subscription fee.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your service will continue until the end of your current billing period.'
    }
  ];

  const getPrice = (plan: typeof pricingPlans[0]) => {
    if (plan.monthlyPrice === 'Custom') return 'Custom';

    if (billingPeriod === 'yearly') {
      return plan.yearlyPrice === 'Custom' ? 'Custom' : `${plan.yearlyPrice}/year`;
    }
    return plan.monthlyPrice;
  };

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
              <Link href='/features' className='text-wise-gray-600 hover:text-wise-green-primary transition-colors'>
                Features
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
      <section className='pt-32 pb-12 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-4xl text-center'>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-5xl lg:text-6xl font-bold text-wise-gray-900 mb-6'
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='text-xl text-wise-gray-600 mb-8'
          >
            Choose the plan that fits your needs. Scale as you grow. No hidden fees.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='inline-flex items-center bg-wise-gray-100 rounded-lg p-1'
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-wise-gray-900 shadow-sm'
                  : 'text-wise-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-wise-gray-900 shadow-sm'
                  : 'text-wise-gray-600'
              }`}
            >
              Yearly
              <span className='ml-2 text-xs bg-wise-green-100 text-wise-green-700 px-2 py-0.5 rounded-full'>
                Save 17%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className='pb-20 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-7xl'>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card-wise p-8 relative ${
                  plan.popular ? 'ring-2 ring-wise-green-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                    <span className='bg-wise-green-primary text-white px-4 py-1 rounded-full text-sm font-medium'>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className='mb-6'>
                  <h3 className='text-2xl font-bold text-wise-gray-900 mb-2'>{plan.name}</h3>
                  <div className='flex items-baseline mb-2'>
                    <span className='text-4xl font-bold text-wise-gray-900'>
                      {getPrice(plan)}
                    </span>
                    {plan.period && <span className='text-wise-gray-600 ml-1'>{plan.period}</span>}
                  </div>
                  {billingPeriod === 'yearly' && plan.savings && (
                    <p className='text-sm text-wise-green-600 font-medium'>
                      Save {plan.savings}% with annual billing
                    </p>
                  )}
                  <p className='text-wise-gray-600 mt-2'>{plan.description}</p>
                </div>

                <ul className='space-y-3 mb-8'>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-start'>
                      <CheckCircle className='w-5 h-5 text-wise-green-primary mr-2 mt-0.5 flex-shrink-0' />
                      <span className='text-wise-gray-700 text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Enterprise' ? '/contact' : '/sign-up'}
                  className={`w-full ${plan.buttonStyle} py-3 text-center block`}
                >
                  {plan.buttonText}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Features Comparison Link */}
          <div className='mt-12 text-center'>
            <Link
              href='/features'
              className='inline-flex items-center text-wise-green-primary hover:text-wise-green-600 font-medium'
            >
              Compare all features
              <ArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-wise-gray-50'>
        <div className='container mx-auto max-w-4xl'>
          <div className='text-center mb-12'>
            <h2 className='text-4xl font-bold text-wise-gray-900 mb-4'>
              Frequently Asked Questions
            </h2>
            <p className='text-xl text-wise-gray-600'>
              Have questions? We've got answers.
            </p>
          </div>

          <div className='space-y-6'>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className='card-wise p-6'
              >
                <div className='flex items-start'>
                  <HelpCircle className='w-6 h-6 text-wise-green-primary mr-3 mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='font-semibold text-wise-gray-900 mb-2'>{faq.question}</h3>
                    <p className='text-wise-gray-600'>{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className='mt-12 text-center'>
            <p className='text-wise-gray-600 mb-4'>Still have questions?</p>
            <Link href='/contact' className='btn-wise-primary px-8 py-3'>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='container mx-auto max-w-5xl'>
          <div className='grid md:grid-cols-3 gap-8 text-center'>
            <div>
              <div className='w-16 h-16 bg-wise-green-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='w-8 h-8 text-wise-green-primary' />
              </div>
              <h3 className='font-semibold text-wise-gray-900 mb-2'>14-Day Free Trial</h3>
              <p className='text-sm text-wise-gray-600'>
                Try any paid plan free for 14 days. No credit card required.
              </p>
            </div>

            <div>
              <div className='w-16 h-16 bg-wise-green-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Zap className='w-8 h-8 text-wise-green-primary' />
              </div>
              <h3 className='font-semibold text-wise-gray-900 mb-2'>Instant Setup</h3>
              <p className='text-sm text-wise-gray-600'>
                Get started in minutes. No complex setup or configuration.
              </p>
            </div>

            <div>
              <div className='w-16 h-16 bg-wise-green-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                <TrendingUp className='w-8 h-8 text-wise-green-primary' />
              </div>
              <h3 className='font-semibold text-wise-gray-900 mb-2'>Scale Anytime</h3>
              <p className='text-sm text-wise-gray-600'>
                Upgrade or downgrade your plan at any time with no penalties.
              </p>
            </div>
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
              Ready to secure your MCP servers?
            </h2>
            <p className='text-xl text-wise-green-100 mb-8'>
              Start your free 14-day trial today. No credit card required.
            </p>
            <Link
              href='/sign-up'
              className='bg-white text-wise-green-primary hover:bg-wise-green-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center'
            >
              Start Free Trial
              <ArrowRight className='w-5 h-5 ml-2' />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
