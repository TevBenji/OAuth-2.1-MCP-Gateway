'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CompletionStepProps {
  onFinish: () => void;
}

const quickLinks = [
  { label: 'View Dashboard', href: '/dashboard' },
  { label: 'Manage Tenants', href: '/dashboard/tenants' },
  { label: 'API Analytics', href: '/dashboard/analytics' },
  { label: 'MCP Servers', href: '/dashboard/mcp-servers' },
] as const;

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
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-wise-green-forest text-wise-green-bright">
                <CheckCircle className="h-12 w-12" />
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-wise-green-bright"
              >
                <span className="text-2xl">🎉</span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-4xl mb-3">You&apos;re All Set!</CardTitle>
            <CardDescription className="text-lg">
              Your OAuth 2.1 gateway is configured and ready to use. Start building secure
              applications today.
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="mb-4 text-lg font-bold tracking-tight text-wise-green-forest">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-center justify-between rounded-xl border border-wise-gray-200 px-4 py-3 transition-all hover:border-wise-green-primary/50 hover:bg-wise-green-50"
                >
                  <span className="text-sm font-semibold text-wise-green-forest">
                    {link.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-wise-gray-400 transition-all group-hover:translate-x-1 group-hover:text-wise-green-primary" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Success Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="rounded-xl border border-wise-green-primary/30 bg-wise-green-50 p-6"
          >
            <h4 className="mb-3 font-bold text-wise-green-forest">
              💡 Tips for Success
            </h4>
            <ul className="space-y-2 text-sm text-wise-gray-700">
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
