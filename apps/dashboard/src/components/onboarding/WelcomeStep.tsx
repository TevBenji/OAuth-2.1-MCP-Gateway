'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Shield,
    title: 'OAuth 2.1 Security',
    description: 'Enterprise-grade authentication with PKCE and modern security standards',
  },
  {
    icon: Zap,
    title: 'Fast Integration',
    description: 'Get up and running in minutes with our comprehensive SDK',
  },
  {
    icon: Lock,
    title: 'Multi-Tenant Support',
    description: 'Manage multiple clients and users with ease',
  },
  {
    icon: Globe,
    title: 'MCP Server Proxy',
    description: 'Seamlessly proxy requests to your Model Context Protocol servers',
  },
];

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-wise-green-100 dark:bg-wise-green-900 flex items-center justify-center">
              <Shield className="h-10 w-10 text-wise-green-600 dark:text-wise-green-400" />
            </div>
          </motion.div>
          <CardTitle className="text-4xl">Welcome to OAuth 2.1 MCP Gateway</CardTitle>
          <CardDescription className="text-lg mt-4">
            Let&apos;s get you set up with secure, modern authentication for your applications.
            This wizard will guide you through the setup process in just a few minutes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-wise-gray-50 dark:hover:bg-wise-gray-800 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-wise-green-100 dark:bg-wise-green-900 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-wise-green-600 dark:text-wise-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-wise-gray-900 dark:text-wise-gray-100">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-wise-gray-600 dark:text-wise-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-wise-blue/10 dark:bg-wise-blue/20 border border-wise-blue/30 rounded-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-3">
              What to expect:
            </h3>
            <ul className="space-y-2 text-sm text-wise-gray-700 dark:text-wise-gray-300">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Register your first OAuth client application</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Configure MCP server endpoints (optional)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Test your integration with sample code</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>Get your credentials and start building</span>
              </li>
            </ul>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={onNext}
              icon={<ArrowRight className="h-5 w-5" />}
              iconPosition="right"
              className="px-8"
            >
              Get Started
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
