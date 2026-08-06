import { Loader2 } from 'lucide-react';
import React from 'react';

/**
 * Props for the PageLoader component.
 */
interface PageLoaderProps {
  /**
   * The message to display below the spinner.
   * @default 'Loading...'
   */
  message?: string;
}

/**
 * A reusable loading skeleton component for dashboard pages.
 * Displays a centered spinner and a message.
 */
const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div
      role="status"
      aria-label={message}
      className="flex h-full w-full min-h-[60vh] items-center justify-center bg-wise-gray-50"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-wise-green-primary" />
        <p className="text-lg text-wise-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
