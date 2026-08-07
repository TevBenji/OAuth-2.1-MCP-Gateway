'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
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
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Settings</h1>
        <p className='text-wise-gray-600 mt-1'>Your account</p>
      </div>

      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <User className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Profile</h2>
        </div>
        <dl className='space-y-4 text-sm'>
          <div>
            <dt className='font-medium text-wise-gray-700'>Name</dt>
            <dd className='text-wise-gray-900 mt-1'>{session?.user?.name || '—'}</dd>
          </div>
          <div>
            <dt className='font-medium text-wise-gray-700'>Email</dt>
            <dd className='text-wise-gray-900 mt-1'>{session?.user?.email || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>Session</h2>
        <button
          onClick={handleSignOut}
          className='btn-wise-secondary px-4 py-2 inline-flex items-center'
        >
          <LogOut className='w-4 h-4 mr-2' />
          Sign Out
        </button>
      </div>
    </div>
  );
}
