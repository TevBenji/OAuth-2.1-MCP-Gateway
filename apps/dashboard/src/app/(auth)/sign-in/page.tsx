import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-wise-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <div className='w-12 h-12 bg-wise-green-primary rounded-xl flex items-center justify-center'>
              <svg
                className='w-7 h-7 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>
          </div>
          <h2 className='text-3xl font-bold text-wise-gray-900'>Welcome back</h2>
          <p className='mt-2 text-wise-gray-600'>
            Sign in to your account to continue
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-wise-card border-wise-gray-200',
            },
          }}
          redirectUrl='/dashboard'
          afterSignInUrl='/dashboard'
        />
      </div>
    </div>
  );
}
