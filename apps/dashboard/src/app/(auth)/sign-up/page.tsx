'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Sign up failed (sign-up may be disabled)');
      return;
    }
    router.push('/onboarding');
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Set up the admin account for your MCP Gateway. Disable sign-up
            (DASHBOARD_ALLOW_SIGNUP=false) once your team is on board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium text-gray-700'>
                Name
              </label>
              <input
                id='name'
                type='text'
                required
                autoComplete='name'
                value={name}
                onChange={e => setName(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20'
              />
            </div>
            <div>
              <label htmlFor='email' className='mb-1 block text-sm font-medium text-gray-700'>
                Email
              </label>
              <input
                id='email'
                type='email'
                required
                autoComplete='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20'
              />
            </div>
            <div>
              <label htmlFor='password' className='mb-1 block text-sm font-medium text-gray-700'>
                Password
              </label>
              <input
                id='password'
                type='password'
                required
                minLength={8}
                autoComplete='new-password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20'
              />
            </div>
            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className='mt-4 text-center text-sm text-gray-500'>
            Already have an account?{' '}
            <Link href='/sign-in' className='font-medium text-green-700 hover:underline'>
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
