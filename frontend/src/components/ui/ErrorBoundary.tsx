'use client';

import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { isHydrationError, analyzeHydrationError } from '@/lib/hydration';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static override getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // You could integrate with error reporting services like Sentry here
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center'>
            <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-6 h-6 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Something went wrong</h2>
            <p className='text-gray-600 mb-6'>
              We're sorry, but something unexpected happened. The error has been logged and our team
              will look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='cursor-pointer text-sm font-medium text-gray-700 mb-2'>
                  Error Details (Development Only)
                </summary>
                <div className='mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto'>
                  <div className='font-semibold mb-1'>Error:</div>
                  <div className='mb-2'>{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <>
                      <div className='font-semibold mb-1'>Stack Trace:</div>
                      <pre className='whitespace-pre-wrap'>{this.state.error.stack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <button
                onClick={this.handleReset}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = () => setError(null);

  const captureError = (error: Error) => {
    console.error('Error captured by useErrorHandler:', error);
    setError(error);
  };

  if (error) {
    throw error;
  }

  return { captureError, resetError };
}

// Specialized error boundary for hydration errors
export function HydrationErrorBoundary({ children }: { children: ReactNode }) {
  const handleHydrationError = (error: Error, errorInfo: ErrorInfo) => {
    // Use hydration utilities for error analysis

    // Check if it's a hydration error
    if (isHydrationError(error)) {
      const analysis = analyzeHydrationError(error);

      console.group(
        `🚫 HydrationErrorBoundary: ${analysis.severity.toUpperCase()} Hydration Error`
      );
      console.warn('Error:', error.message);
      console.warn('Likely Cause:', analysis.likelyCause);
      if (analysis.suggestions.length > 0) {
        console.info('Suggestions:', analysis.suggestions);
      }
      console.groupEnd();

      // In development, show a more detailed error
      if (process.env.NODE_ENV === 'development') {
        // Create a temporary error banner
        const banner = document.createElement('div');
        banner.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          max-width: 500px;
          text-align: center;
        `;
        banner.innerHTML = `
          <strong>Hydration Error Handled</strong><br>
          <span style="font-size: 12px; opacity: 0.9;">${analysis.likelyCause}</span>
        `;

        document.body.appendChild(banner);
        setTimeout(() => {
          if (banner.parentElement) {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
              if (banner.parentElement) {
                banner.parentElement.removeChild(banner);
              }
            }, 300);
          }
        }, 3000);
      }

      return; // Don't report hydration errors to external services
    }

    // Log other errors normally
    console.error('Non-hydration error in HydrationErrorBoundary:', error, errorInfo);
  };

  return (
    <ErrorBoundary
      onError={handleHydrationError}
      fallback={
        <div
          style={{
            visibility: 'hidden',
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
          }}
          suppressHydrationWarning
        >
          {children}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
