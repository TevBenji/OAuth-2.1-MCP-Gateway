import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
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
                  d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                />
              </svg>
            </div>
          </div>
          <h2 className='text-3xl font-bold text-wise-gray-900'>Create your account</h2>
          <p className='mt-2 text-wise-gray-600'>
            Start securing your MCP servers today
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-wise-card border-wise-gray-200',
            },
          }}
          redirectUrl='/onboarding'
          afterSignUpUrl='/onboarding'
        />
        <div className='mt-6 text-center'>
          <p className='text-sm text-wise-gray-600'>
            By signing up, you agree to our{' '}
            <a href='/terms' className='text-wise-green-primary hover:text-wise-green-600 font-medium'>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href='/privacy' className='text-wise-green-primary hover:text-wise-green-600 font-medium'>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
