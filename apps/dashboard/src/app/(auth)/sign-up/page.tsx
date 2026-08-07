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
    <main className='flex min-h-screen flex-col items-center justify-center bg-wise-green-forest p-4'>
      <Link href='/' className='mb-8 flex items-center gap-2.5'>
        <span className='flex h-8 w-8 items-center justify-center rounded-md bg-wise-green-bright text-base font-black text-wise-green-forest'>
          G
        </span>
        <span className='text-base font-semibold tracking-tight text-white'>MCP Gateway</span>
      </Link>
      <Card className='w-full max-w-md' padding='lg'>
        <CardHeader className='pb-6'>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Set up the admin account for your MCP Gateway. Disable sign-up
            (DASHBOARD_ALLOW_SIGNUP=false) once your team is on board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium text-wise-gray-700'>
                Name
              </label>
              <input
                id='name'
                type='text'
                required
                autoComplete='name'
                value={name}
                onChange={e => setName(e.target.value)}
                className='input-wise'
              />
            </div>
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
              <label
                htmlFor='password'
                className='mb-1 block text-sm font-medium text-wise-gray-700'
              >
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
                className='input-wise'
              />
            </div>
            <Button type='submit' disabled={loading} size='lg' className='w-full'>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className='mt-4 text-center text-sm text-wise-gray-500'>
            Already have an account?{' '}
            <Link href='/sign-in' className='font-semibold text-wise-green-700 hover:underline'>
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
