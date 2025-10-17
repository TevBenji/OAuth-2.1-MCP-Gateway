/**
 * Hydration Error Utilities
 *
 * Utilities to handle and prevent hydration mismatches caused by
 * browser extensions, server/client differences, and dynamic content.
 */

import React from 'react';

/**
 * Browser extension detection and management
 */
export interface ExtensionInfo {
  name: string;
  detected: boolean;
  elements: string[];
  attributes: string[];
  warnings: string[];
}

/**
 * Comprehensive browser extension detection
 */
export function detectBrowserExtensions(): ExtensionInfo[] {
  if (typeof window === 'undefined') return [];

  const extensions: ExtensionInfo[] = [];

  // Grammarly detection
  const grammarlyInfo: ExtensionInfo = {
    name: 'Grammarly',
    detected: false,
    elements: [],
    attributes: [],
    warnings: [],
  };

  if (document.querySelector('[data-grammarly-shadow]')) {
    grammarlyInfo.detected = true;
    grammarlyInfo.elements.push('[data-grammarly-shadow]');
    grammarlyInfo.warnings.push('May add shadow DOM elements that cause hydration mismatches');
  }

  if (document.querySelector('[data-grammarly-editor]')) {
    grammarlyInfo.detected = true;
    grammarlyInfo.elements.push('[data-grammarly-editor]');
  }

  if ((window as any).Grammarly) {
    grammarlyInfo.detected = true;
    grammarlyInfo.warnings.push('Global Grammarly object detected');
  }

  if (grammarlyInfo.detected) extensions.push(grammarlyInfo);

  // BIS (Browser Image Search) extension detection
  const bisInfo: ExtensionInfo = {
    name: 'BIS Extension',
    detected: false,
    elements: [],
    attributes: ['bis_skin_checked', 'bis_register'],
    warnings: ['Adds bis_skin_checked attribute that causes hydration errors'],
  };

  if (document.querySelector('[bis_skin_checked]') || document.querySelector('[bis_register]')) {
    bisInfo.detected = true;
    extensions.push(bisInfo);
  }

  // Other common extensions
  const otherExtensions: ExtensionInfo = {
    name: 'Other Extensions',
    detected: false,
    elements: [],
    attributes: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'],
    warnings: ['May modify DOM attributes causing hydration issues'],
  };

  if (
    document.querySelector('[data-new-gr-c-s-check-loaded]') ||
    document.querySelector('[data-gr-ext-installed]')
  ) {
    otherExtensions.detected = true;
    extensions.push(otherExtensions);
  }

  return extensions;
}

/**
 * Show user-friendly warning about detected extensions
 */
export function showExtensionWarning(extensions: ExtensionInfo[]): void {
  if (extensions.length === 0) return;

  const detectedNames = extensions.map(ext => ext.name).join(', ');
  const allWarnings = extensions.flatMap(ext => ext.warnings);

  console.group(`🔍 Browser Extensions Detection`);
  console.warn(`Detected: ${detectedNames}`);
  allWarnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  console.info(
    '💡 Consider disabling these extensions while developing. The app will attempt to work around them.'
  );
  console.groupEnd();

  // Show development banner
  if (process.env.NODE_ENV === 'development') {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #78350f;
      padding: 16px 20px;
      border-radius: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
      max-width: 350px;
      line-height: 1.5;
      border: 1px solid rgba(251, 191, 36, 0.5);
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 16px; margin-right: 8px;">⚠️</span>
        <strong>Extensions Detected</strong>
      </div>
      <div style="margin-bottom: 8px;">${detectedNames} may cause hydration errors</div>
      <div style="font-size: 11px; opacity: 0.8;">This warning only appears in development</div>
    `;

    document.body.appendChild(banner);

    // Auto-remove after 8 seconds
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
    }, 8000);
  }
}

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
    'text content mismatch',
    'attribute mismatch',
    'html structure mismatch',
    'react 18 hydration',
    'useeffect cleanup',
  ];

  return hydrationPatterns.some(pattern => message.includes(pattern) || stack.includes(pattern));
}

/**
 * Enhanced error detection with context analysis
 */
export function analyzeHydrationError(error: Error): {
  isHydration: boolean;
  severity: 'low' | 'medium' | 'high';
  likelyCause: string;
  suggestions: string[];
} {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  if (!isHydrationError(error)) {
    return {
      isHydration: false,
      severity: 'low',
      likelyCause: 'Non-hydration error',
      suggestions: [],
    };
  }

  let likelyCause = 'Unknown hydration issue';
  let severity: 'low' | 'medium' | 'high' = 'medium';
  const suggestions: string[] = [];

  if (message.includes('bis_skin_checked') || message.includes('bis_register')) {
    likelyCause = 'Browser extension modifying DOM attributes';
    severity = 'high';
    suggestions.push('Disable BIS extension or use incognito mode');
    suggestions.push('Add extension attributes to cleanup list');
  } else if (message.includes('grammarly')) {
    likelyCause = 'Grammarly extension modifying DOM';
    severity = 'medium';
    suggestions.push('Disable Grammarly for this site');
    suggestions.push('Use Grammarly desktop app instead');
  } else if (message.includes('text content') && message.includes('mismatch')) {
    likelyCause = 'Server-client text content difference';
    severity = 'medium';
    suggestions.push('Check for dynamic content rendering differently on server vs client');
    suggestions.push('Use ClientOnly component for dynamic content');
  } else if (message.includes('attribute')) {
    likelyCause = 'Server-client attribute mismatch';
    severity = 'low';
    suggestions.push('Check conditional attributes');
    suggestions.push('Ensure consistent attribute values');
  }

  return {
    isHydration: true,
    severity,
    likelyCause,
    suggestions,
  };
}

/**
 * Enhanced cleanup for browser extension modifications from the DOM
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
    'translate',
    'spellcheck',
    'data-new-gr-c-s-loaded',
    'grammarly-shadow',
  ];

  extensionAttributes.forEach(attr => {
    const elements = document.querySelectorAll(`[${attr}]`);
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.removeAttribute(attr);
      }
    });
  });

  // Clean up document and body elements
  [document.documentElement, document.body].forEach(element => {
    extensionAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
  });

  // Remove common extension elements
  const extensionSelectors = [
    '[id*="grammarly"]',
    '[id*="bis_ext"]',
    '[id*="gr_"]',
    '[class*="grammarly"]',
    '[class*="bis-"]',
    '[data-grammarly-shadow]',
    '[data-new-gr-c-s-loaded]',
    'div[style*="position: fixed"][style*="z-index: 2147483647"]',
    'iframe[id*="grammarly"]',
    'div[style*="z-index: 2147483646"]', // Grammarly popup
  ];

  extensionSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement && el.parentElement) {
          const computedStyle = window.getComputedStyle(el);
          const zIndex = parseInt(computedStyle.zIndex || '0');
          const position = computedStyle.position;

          // Only remove if it's clearly an extension element
          if (
            (position === 'fixed' && zIndex > 1000) ||
            el.id.includes('grammarly') ||
            el.id.includes('bis_ext') ||
            el.id.includes('gr_')
          ) {
            el.parentElement.removeChild(el);
          }
        }
      });
    } catch (error) {
      // Ignore errors in cleanup
      console.warn('Error cleaning up browser extensions:', error);
    }
  });

  // Remove any style elements added by extensions
  const styleElements = document.querySelectorAll('style[data-emotion], style[data-gram]');
  styleElements.forEach(el => {
    if (el.parentElement && el.getAttribute('data-emotion')?.includes('grammarly')) {
      el.parentElement.removeChild(el);
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
 * Initialize hydration monitoring with enhanced detection
 */
export function initializeHydrationHandling(): void {
  if (typeof window !== 'undefined') {
    // Initialize the monitor
    HydrationMonitor.getInstance();

    // Detect extensions first
    const extensions = detectBrowserExtensions();
    if (extensions.length > 0) {
      showExtensionWarning(extensions);
    }

    // Clean up immediately
    cleanupBrowserExtensions();

    // Set up periodic cleanup for aggressive extensions
    const cleanupInterval = setInterval(() => {
      cleanupBrowserExtensions();
    }, 500);

    // Also run cleanup on DOM content changes
    const observer = new MutationObserver(() => {
      cleanupBrowserExtensions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Clean up interval and observer after 15 seconds
    setTimeout(() => {
      clearInterval(cleanupInterval);
      observer.disconnect();
    }, 15000);

    // Set up global error handler for hydration errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (isHydrationError(new Error(message))) {
        const analysis = analyzeHydrationError(new Error(message));
        console.warn(`🚫 Hydration Error (${analysis.severity}): ${analysis.likelyCause}`);
        if (analysis.suggestions.length > 0) {
          console.info('💡 Suggestions:', analysis.suggestions);
        }
        return; // Suppress the original error
      }
      originalConsoleError.apply(console, args);
    };

    // Restore original console error after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.error = originalConsoleError;
      }, 5000);
    });
  }
}

// Export the monitor instance for direct access
export const hydrationMonitor = HydrationMonitor.getInstance();
