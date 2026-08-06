'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, MessageCircle, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CompletionStepProps {
  onFinish: () => void;
}

const resources = [
  {
    icon: BookOpen,
    title: 'API Documentation',
    description: 'Comprehensive guides and API references',
    href: '/docs/api',
    color: 'text-wise-blue',
    bgColor: 'bg-wise-blue/10',
  },
  {
    icon: FileText,
    title: 'Integration Examples',
    description: 'Sample code and best practices',
    href: '/docs/examples',
    color: 'text-wise-green-600',
    bgColor: 'bg-wise-green-100',
  },
  {
    icon: MessageCircle,
    title: 'Community Support',
    description: 'Get help from our developer community',
    href: '/community',
    color: 'text-wise-purple',
    bgColor: 'bg-wise-purple/10',
  },
];

const quickLinks = [
  { label: 'View Dashboard', href: '/dashboard' },
  { label: 'Manage Clients', href: '/dashboard/clients' },
  { label: 'API Analytics', href: '/dashboard/analytics' },
  { label: 'Security Settings', href: '/dashboard/security' },
];

export function CompletionStep({ onFinish }: CompletionStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6"
          >
            <div className="relative">
              <div className="h-24 w-24 mx-auto rounded-full bg-wise-green-100 dark:bg-wise-green-900 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-wise-green-600 dark:text-wise-green-400" />
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-2 -right-2 h-8 w-8 bg-wise-green-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-2xl">🎉</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-4xl mb-3">You're All Set!</CardTitle>
            <CardDescription className="text-lg">
              Your OAuth 2.1 gateway is configured and ready to use. Start building secure
              applications today.
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Resources Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-4">
              Helpful Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Link
                    href={resource.href}
                    className="block p-6 rounded-lg border border-wise-gray-300 dark:border-wise-gray-600 hover:border-wise-green-500 transition-all hover:shadow-lg group"
                  >
                    <div
                      className={`h-12 w-12 rounded-lg ${resource.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <resource.icon className={`h-6 w-6 ${resource.color}`} />
                    </div>
                    <h4 className="font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-2">
                      {resource.title}
                    </h4>
                    <p className="text-sm text-wise-gray-600 dark:text-wise-gray-400">
                      {resource.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-xl font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-4">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-wise-gray-300 dark:border-wise-gray-600 hover:border-wise-green-500 hover:bg-wise-green-50 dark:hover:bg-wise-green-900/20 transition-all group"
                >
                  <span className="text-sm font-medium text-wise-gray-700 dark:text-wise-gray-300 group-hover:text-wise-green-700 dark:group-hover:text-wise-green-400">
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-wise-gray-400 group-hover:text-wise-green-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Success Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-wise-green-50 dark:bg-wise-green-900/20 border border-wise-green-200 dark:border-wise-green-700 rounded-lg p-6"
          >
            <h4 className="font-semibold text-wise-gray-900 dark:text-wise-gray-100 mb-3">
              💡 Tips for Success
            </h4>
            <ul className="space-y-2 text-sm text-wise-gray-700 dark:text-wise-gray-300">
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Store your client credentials in a secure environment (e.g., env variables)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Always use HTTPS in production for redirect URIs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Implement proper token refresh logic to maintain user sessions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Monitor your API usage and security events in the dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">✓</span>
                <span>Keep your SDK updated to the latest version for security patches</span>
              </li>
            </ul>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="flex justify-center pt-4"
          >
            <Button
              size="lg"
              onClick={onFinish}
              icon={<ArrowRight className="h-5 w-5" />}
              iconPosition="right"
              className="px-8"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
