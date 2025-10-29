'use client';

/**
 * OnboardingBannerSkeleton Component
 *
 * Provides a loading skeleton for the onboarding banner.
 * Matches the exact dimensions of the real banner to prevent layout shift.
 */

export function OnboardingBannerSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Icon Skeleton */}
          <div className="p-2 bg-gray-300 rounded-lg mt-1 flex-shrink-0 w-10 h-10" />

          {/* Content Skeleton */}
          <div className="flex-1 space-y-3">
            {/* Title Skeleton */}
            <div className="h-6 bg-gray-300 rounded w-2/3" />

            {/* Description Lines Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
            </div>

            {/* Button Skeleton */}
            <div className="h-10 bg-gray-300 rounded w-40 mt-3" />
          </div>
        </div>

        {/* Close Button Skeleton */}
        <div className="p-1 rounded-lg flex-shrink-0 w-6 h-6 bg-gray-300 ml-4" />
      </div>
    </div>
  );
}
