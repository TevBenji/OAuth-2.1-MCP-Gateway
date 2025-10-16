'use client';

import { useEffect, useState } from 'react';
import React from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * HydrationBoundary prevents hydration mismatches caused by:
 * - Browser extensions modifying the DOM
 * - Server/client rendering differences
 * - Dynamic content that changes between renders
 */
export function HydrationBoundary({ children, fallback }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for the client to fully hydrate
    setIsHydrated(true);

    // Clean up any browser extension modifications
    const cleanupBrowserExtensions = () => {
      // Remove common browser extension attributes
      const elements = document.querySelectorAll('[bis_skin_checked], [bis_register]');
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.removeAttribute('bis_skin_checked');
          el.removeAttribute('bis_register');
        }
      });
    };

    cleanupBrowserExtensions();

    // Also clean up after a short delay for slow-loading extensions
    const timeoutId = setTimeout(cleanupBrowserExtensions, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isHydrated) {
    return <>{fallback || <div style={{ visibility: 'hidden' }}>{children}</div>}</>;
  }

  return <>{children}</>;
}

/**
 * A client-only component that prevents server-side rendering
 * Useful for components that rely on browser APIs
 */
export function ClientOnly({ children, fallback }: HydrationBoundaryProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to detect hydration state
 */
export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
