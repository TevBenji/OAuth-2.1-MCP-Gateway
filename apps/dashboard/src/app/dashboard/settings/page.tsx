'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useSession, signOut } from '@/lib/auth-client';

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  if (isPending) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-4 border-wise-green-primary border-t-transparent'></div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl space-y-6'>
      <PageHeader eyebrow='Account' title='Settings' description='Your account' />

      <div className='card-wise p-6'>
        <div className='mb-6 flex items-center gap-3'>
          <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
            <User className='h-[18px] w-[18px]' />
          </span>
          <h2 className='text-lg font-bold tracking-tight text-wise-green-forest'>Profile</h2>
        </div>
        <dl className='space-y-4 text-sm'>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Name
            </dt>
            <dd className='mt-1 text-wise-gray-900'>{session?.user?.name || '—'}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
              Email
            </dt>
            <dd className='mt-1 text-wise-gray-900'>{session?.user?.email || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className='card-wise p-6'>
        <h2 className='mb-4 text-lg font-bold tracking-tight text-wise-green-forest'>Session</h2>
        <button
          onClick={handleSignOut}
          className='btn-wise-secondary inline-flex h-10 items-center px-4'
        >
          <LogOut className='mr-2 h-4 w-4' />
          Sign Out
        </button>
      </div>
    </div>
  );
}
