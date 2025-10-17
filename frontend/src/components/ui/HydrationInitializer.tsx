'use client';

import { useEffect, useState } from 'react';
import { initializeHydrationHandling } from '@/lib/hydration';

/**
 * HydrationInitializer Component
 *
 * This component initializes hydration error handling when mounted.
 * It should be placed high in the component tree to catch and handle
 * hydration mismatches caused by browser extensions.
 */
export function HydrationInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;
    setIsInitialized(true);

    // Immediate cleanup before React can render
    const immediateCleanup = () => {
      // Clean up document element
      const docElement = document.documentElement;
      const problematicAttrs = [
        'bis_skin_checked',
        'bis_register',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'data-grammarly-shadow-editor',
        'data-grammarly-editor',
        'translate',
        'spellcheck',
      ];

      problematicAttrs.forEach(attr => {
        if (docElement.hasAttribute(attr)) {
          docElement.removeAttribute(attr);
        }
      });

      // Clean up body element
      const bodyElement = document.body;
      problematicAttrs.forEach(attr => {
        if (bodyElement.hasAttribute(attr)) {
          bodyElement.removeAttribute(attr);
        }
      });

      // Remove extension elements that are commonly problematic
      const extensionSelectors = [
        '[id*="grammarly"]',
        '[id*="bis_ext"]',
        '[class*="grammarly"]',
        '[class*="bis-"]',
        'div[style*="position: fixed"][style*="z-index: 2147483647"]',
        '[data-grammarly-shadow]',
        '[data-new-gr-c-s-loaded]',
      ];

      extensionSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el instanceof HTMLElement && el.parentElement) {
              const computedStyle = window.getComputedStyle(el);
              if (
                computedStyle.position === 'fixed' &&
                parseInt(computedStyle.zIndex || '0') > 1000
              ) {
                el.parentElement.removeChild(el);
              }
            }
          });
        } catch (error) {
          // Ignore errors in cleanup
        }
      });
    };

    // Run immediate cleanup
    immediateCleanup();

    // Initialize hydration error handling
    initializeHydrationHandling();

    // Detect browser extensions and warn users
    const detectBrowserExtensions = () => {
      const detectedExtensions: string[] = [];

      // Check for Grammarly
      if (
        document.querySelector('[data-grammarly-shadow]') ||
        document.querySelector('[data-grammarly-editor]') ||
        window.hasOwnProperty('Grammarly')
      ) {
        detectedExtensions.push('Grammarly');
      }

      // Check for other common extensions
      if (
        document.querySelector('[bis_skin_checked]') ||
        document.querySelector('[bis_register]')
      ) {
        detectedExtensions.push('Browser Extensions (BIS)');
      }

      if (detectedExtensions.length > 0) {
        console.warn(
          `⚠️ Browser extensions detected that may cause hydration errors: ${detectedExtensions.join(', ')}`,
          '\nConsider disabling these extensions while developing or using the app.',
          '\nThe app will attempt to work around these extensions, but you may experience UI issues.'
        );

        // Show a user-friendly warning in development
        if (process.env.NODE_ENV === 'development') {
          const warningDiv = document.createElement('div');
          warningDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #fbbf24;
            color: #92400e;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 300px;
          `;
          warningDiv.innerHTML = `
            <strong>⚠️ Extension Detected</strong><br>
            ${detectedExtensions.join(', ')} may cause display issues.
          `;
          document.body.appendChild(warningDiv);

          // Remove warning after 5 seconds
          setTimeout(() => {
            if (warningDiv.parentElement) {
              warningDiv.parentElement.removeChild(warningDiv);
            }
          }, 5000);
        }
      }
    };

    // Set up a more aggressive mutation observer
    const observer = new MutationObserver(mutations => {
      let needsCleanup = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          const element = mutation.target as HTMLElement;
          const attributeName = mutation.attributeName;

          // Remove problematic attributes added by browser extensions
          if (
            attributeName &&
            (attributeName.includes('bis_skin_checked') ||
              attributeName.includes('bis_register') ||
              attributeName.includes('grammarly') ||
              attributeName.includes('ext-') ||
              attributeName.includes('new-gr-c-s') ||
              attributeName === 'translate' ||
              attributeName === 'spellcheck')
          ) {
            element.removeAttribute(attributeName);
            needsCleanup = true;
          }
        } else if (mutation.type === 'childList') {
          // Check for problematic new elements
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const tagName = element.tagName.toLowerCase();

              // Check for common extension elements
              if (
                element.id &&
                (element.id.includes('grammarly') ||
                  element.id.includes('bis_ext') ||
                  element.id.includes('gr_'))
              ) {
                if (element.parentElement) {
                  element.parentElement.removeChild(element);
                  needsCleanup = true;
                }
              }
            }
          });
        }
      });

      // If we made changes, run a full cleanup
      if (needsCleanup) {
        setTimeout(immediateCleanup, 0);
      }
    });

    // Observe the entire document more aggressively
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: [
        'bis_skin_checked',
        'bis_register',
        'data-grammarly-shadow-editor',
        'data-grammarly-editor',
        'data-new-gr-c-s-check-loaded',
        'data-gr-ext-installed',
        'translate',
        'spellcheck',
      ],
    });

    // Run detection and cleanup periodically for aggressive extensions
    const cleanupInterval = setInterval(() => {
      immediateCleanup();
    }, 500);

    // Detect extensions after a short delay
    setTimeout(detectBrowserExtensions, 1000);

    // Clean up on unmount
    return () => {
      observer.disconnect();
      clearInterval(cleanupInterval);
    };
  }, [isInitialized]);

  // This component doesn't render anything
  return null;
}
