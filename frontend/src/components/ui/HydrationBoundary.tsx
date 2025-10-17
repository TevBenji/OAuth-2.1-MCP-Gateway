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
  const [cleanupAttempts, setCleanupAttempts] = useState(0);

  useEffect(() => {
    // Prevent double hydration
    if (isHydrated) return;

    // Immediate cleanup before hydration
    const immediateCleanup = () => {
      const problematicAttrs = [
        'bis_skin_checked',
        'bis_register',
        'data-grammarly-shadow-editor',
        'data-grammarly-editor',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'translate',
        'spellcheck',
      ];

      // Clean document element
      const docElement = document.documentElement;
      problematicAttrs.forEach(attr => {
        if (docElement.hasAttribute(attr)) {
          docElement.removeAttribute(attr);
        }
      });

      // Clean body element
      const bodyElement = document.body;
      problematicAttrs.forEach(attr => {
        if (bodyElement.hasAttribute(attr)) {
          bodyElement.removeAttribute(attr);
        }
      });

      // Clean all elements with these attributes
      const elements = document.querySelectorAll(
        problematicAttrs.map(attr => `[${attr}]`).join(', ')
      );
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          problematicAttrs.forEach(attr => {
            if (el.hasAttribute(attr)) {
              el.removeAttribute(attr);
            }
          });
        }
      });
    };

    // Run immediate cleanup
    immediateCleanup();

    // Mark as hydrated after cleanup
    const hydrationTimeout = setTimeout(() => {
      setIsHydrated(true);
    }, 50);

    // Cleanup interval for aggressive extensions
    const cleanupInterval = setInterval(() => {
      immediateCleanup();
      setCleanupAttempts(prev => prev + 1);
    }, 200);

    // Clean up after multiple attempts or when hydrated
    const finalCleanup = setTimeout(() => {
      clearInterval(cleanupInterval);
      clearTimeout(hydrationTimeout);
      setIsHydrated(true);
    }, 2000);

    return () => {
      clearTimeout(hydrationTimeout);
      clearTimeout(finalCleanup);
      clearInterval(cleanupInterval);
    };
  }, [isHydrated, cleanupAttempts]);

  if (!isHydrated) {
    // During hydration, show a minimal placeholder that matches server structure
    if (fallback) {
      return <>{fallback}</>;
    }

    // Use a hidden placeholder that maintains DOM structure
    return (
      <div
        style={{
          visibility: 'hidden',
          height: '0px',
          overflow: 'hidden',
          position: 'absolute',
          top: '-9999px',
        }}
        suppressHydrationWarning
      >
        {children}
      </div>
    );
  }

  // Once hydrated, render children normally
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
