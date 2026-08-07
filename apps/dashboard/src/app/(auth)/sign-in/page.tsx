'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Sign in failed');
      return;
    }
    router.push(searchParams.get('redirect') ?? '/dashboard');
  }

  return (
    <Card className='w-full max-w-md' padding='lg'>
      <CardHeader className='pb-6'>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your MCP Gateway dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='email' className='mb-1 block text-sm font-medium text-wise-gray-700'>
              Email
            </label>
            <input
              id='email'
              type='email'
              required
              autoComplete='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='input-wise'
            />
          </div>
          <div>
            <label htmlFor='password' className='mb-1 block text-sm font-medium text-wise-gray-700'>
              Password
            </label>
            <input
              id='password'
              type='password'
              required
              autoComplete='current-password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='input-wise'
            />
          </div>
          <Button type='submit' disabled={loading} size='lg' className='w-full'>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className='mt-4 text-center text-sm text-wise-gray-500'>
          No account?{' '}
          <Link href='/sign-up' className='font-semibold text-wise-green-700 hover:underline'>
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-wise-green-forest p-4'>
      <Link href='/' className='mb-8 flex items-center gap-2.5'>
        <span className='flex h-8 w-8 items-center justify-center rounded-md bg-wise-green-bright text-base font-black text-wise-green-forest'>
          G
        </span>
        <span className='text-base font-semibold tracking-tight text-white'>MCP Gateway</span>
      </Link>
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
