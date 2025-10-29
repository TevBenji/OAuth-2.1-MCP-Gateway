'use client';

/**
 * HydrationSafeRenderer Component
 *
 * Prevents hydration mismatches by only rendering content after mount.
 * Shows a fallback skeleton during SSR and initial hydration.
 *
 * Usage:
 * <HydrationSafeRenderer fallback={<YourSkeleton />}>
 *   <YourComponent />
 * </HydrationSafeRenderer>
 */

import { ReactNode, useEffect, useState } from 'react';

interface HydrationSafeRendererProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function HydrationSafeRenderer({
  children,
  fallback = null
}: HydrationSafeRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return fallback;
  }

  return children;
}
