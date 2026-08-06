'use client';

/**
 * DashboardSkeleton Component
 *
 * Provides a loading skeleton that matches the dashboard layout structure.
 * Prevents hydration mismatches by showing placeholder content during initial load.
 * Uses Tailwind's animate-pulse for smooth skeleton animations.
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Onboarding Banner Skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-10 h-10 bg-gray-300 rounded-lg mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-300 rounded w-2/3" />
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-10 bg-gray-300 rounded w-32 mt-2" />
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-300 rounded flex-shrink-0" />
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={`stat-skeleton-${i}`} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Usage Chart Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="flex items-center justify-end space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="w-full h-64 bg-gray-100 rounded" />
        </div>

        {/* Provider Distribution Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-full h-48 bg-gray-100 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={`provider-skeleton-${i}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`activity-skeleton-${i}`} className="flex items-start space-x-3 p-3 rounded-lg">
                <div className="w-4 h-4 bg-gray-200 rounded mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={`action-skeleton-${i}`} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Status Skeleton */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="w-full max-w-xs h-2 bg-gray-300 rounded-full mt-3" />
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <div className="h-10 bg-gray-300 rounded w-40" />
            <div className="h-3 bg-gray-300 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
