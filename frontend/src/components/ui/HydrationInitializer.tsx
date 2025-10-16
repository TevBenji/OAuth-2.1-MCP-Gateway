'use client';

import { useEffect } from 'react';
import { initializeHydrationHandling } from '@/lib/hydration';

/**
 * HydrationInitializer Component
 *
 * This component initializes hydration error handling when mounted.
 * It should be placed high in the component tree to catch and handle
 * hydration mismatches caused by browser extensions.
 */
export function HydrationInitializer() {
  useEffect(() => {
    // Initialize hydration error handling
    initializeHydrationHandling();

    // Set up a mutation observer to catch DOM changes from extensions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const element = mutation.target as HTMLElement;
          const attributeName = mutation.attributeName;

          // Remove problematic attributes added by browser extensions
          if (attributeName && (
            attributeName.includes('bis_skin_checked') ||
            attributeName.includes('bis_register') ||
            attributeName.includes('grammarly') ||
            attributeName.includes('ext-')
          )) {
            element.removeAttribute(attributeName);
          }
        }
      });
    });

    // Observe the entire document for attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['bis_skin_checked', 'bis_register', 'data-grammarly-shadow-editor'],
      subtree: true
    });

    // Clean up observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
