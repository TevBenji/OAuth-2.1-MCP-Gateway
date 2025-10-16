/**
 * Hydration Error Utilities
 *
 * Utilities to handle and prevent hydration mismatches caused by
 * browser extensions, server/client differences, and dynamic content.
 */

import React from 'react';

/**
 * Detects if the current error is a hydration-related error
 */
export function isHydrationError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Common hydration error patterns
  const hydrationPatterns = [
    'hydration',
    'server rendered html',
    "didn't match",
    'client properties',
    'tree hydrated',
    'bis_skin_checked',
    'bis_register',
    'text content does not match',
    'mismatch',
  ];

  return hydrationPatterns.some(pattern => message.includes(pattern) || stack.includes(pattern));
}

/**
 * Cleans up browser extension modifications from the DOM
 */
export function cleanupBrowserExtensions(): void {
  if (typeof window === 'undefined') return;

  // Remove common browser extension attributes
  const extensionAttributes = [
    'bis_skin_checked',
    'bis_register',
    'data-new-gr-c-s-check-loaded',
    'data-gr-ext-installed',
    'data-grammarly-shadow-editor',
    'data-grammarly-editor',
  ];

  extensionAttributes.forEach(attr => {
    const elements = document.querySelectorAll(`[${attr}]`);
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.removeAttribute(attr);
      }
    });
  });

  // Remove common extension elements
  const extensionSelectors = [
    '[id*="grammarly"]',
    '[id*="bis_ext"]',
    '[class*="grammarly"]',
    '[class*="bis-"]',
    'div[style*="position: fixed"][style*="z-index: 2147483647"]', // Common for extensions
  ];

  extensionSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement && el.parentElement) {
          // Only remove if it's clearly an extension element
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.position === 'fixed' && parseInt(computedStyle.zIndex || '0') > 1000) {
            el.parentElement.removeChild(el);
          }
        }
      });
    } catch (error) {
      // Ignore errors in cleanup
      console.warn('Error cleaning up browser extensions:', error);
    }
  });
}

/**
 * Defers a function until after hydration is complete
 */
export function deferUntilHydrated<T>(fn: () => T): Promise<T> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') {
      // Server-side - resolve immediately
      resolve(fn());
      return;
    }

    // Check if document is already hydrated
    if (document.readyState === 'complete') {
      cleanupBrowserExtensions();
      resolve(fn());
      return;
    }

    // Wait for DOMContentLoaded and cleanup
    const handleLoad = () => {
      cleanupBrowserExtensions();
      setTimeout(() => resolve(fn()), 100); // Small delay for extensions to load
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleLoad, { once: true });
    } else {
      handleLoad();
    }
  });
}

/**
 * Creates a wrapper component that prevents hydration mismatches
 */
export function createSafeComponent<T extends Record<string, any>>(
  component: React.ComponentType<T>,
  fallback?: React.ComponentType
) {
  const SafeComponent = (props: T) => {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
      setIsClient(true);
      cleanupBrowserExtensions();
    }, []);

    if (!isClient && fallback) {
      return React.createElement(fallback, props);
    }

    return React.createElement(component, props);
  };

  SafeComponent.displayName = `SafeComponent(${component.displayName || component.name})`;
  return SafeComponent;
}

/**
 * Hook to safely use browser APIs
 */
export function useBrowserAPI<T>(getter: () => T, defaultValue: T): T {
  const [value, setValue] = React.useState(defaultValue);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    try {
      setValue(getter());
    } catch (error) {
      console.warn('Error in useBrowserAPI:', error);
      setValue(defaultValue);
    }
  }, [getter, defaultValue]);

  return isClient ? value : defaultValue;
}

/**
 * Monitors for hydration errors and handles them gracefully
 */
export class HydrationMonitor {
  private static instance: HydrationMonitor;
  private handledErrors = new Set<string>();

  static getInstance(): HydrationMonitor {
    if (!HydrationMonitor.instance) {
      HydrationMonitor.instance = new HydrationMonitor();
    }
    return HydrationMonitor.instance;
  }

  private constructor() {
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      if (event.reason instanceof Error && isHydrationError(event.reason)) {
        console.warn('Hydration error in unhandled promise rejection:', event.reason.message);
        event.preventDefault(); // Prevent error from being logged to console
      }
    });

    // Handle uncaught errors
    window.addEventListener('error', event => {
      if (event.error instanceof Error && isHydrationError(event.error)) {
        console.warn('Hydration error in uncaught error:', event.error.message);
        event.preventDefault();
      }
    });
  }

  public handleError(error: Error): boolean {
    const errorKey = `${error.name}:${error.message}`;

    if (this.handledErrors.has(errorKey)) {
      return true; // Already handled
    }

    if (isHydrationError(error)) {
      this.handledErrors.add(errorKey);
      console.warn('Hydration error handled:', error.message);

      // Clean up any browser extension artifacts
      cleanupBrowserExtensions();

      return true;
    }

    return false;
  }

  public clearHandledErrors(): void {
    this.handledErrors.clear();
  }
}

/**
 * Initialize hydration monitoring
 */
export function initializeHydrationHandling(): void {
  if (typeof window !== 'undefined') {
    // Initialize the monitor
    HydrationMonitor.getInstance();

    // Clean up immediately
    cleanupBrowserExtensions();

    // Set up periodic cleanup for aggressive extensions
    const cleanupInterval = setInterval(() => {
      cleanupBrowserExtensions();
    }, 1000);

    // Clean up interval after 10 seconds
    setTimeout(() => {
      clearInterval(cleanupInterval);
    }, 10000);
  }
}

// Export the monitor instance for direct access
export const hydrationMonitor = HydrationMonitor.getInstance();
