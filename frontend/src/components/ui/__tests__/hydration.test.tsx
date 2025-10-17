/**
 * Hydration Error Handling Tests
 *
 * Tests to verify that hydration error handling components work correctly
 * and prevent hydration mismatches caused by browser extensions.
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { HydrationBoundary } from '../HydrationBoundary';
import { HydrationInitializer } from '../HydrationInitializer';
import { HydrationErrorBoundary } from '../ErrorBoundary';
import * as hydrationUtils from '@/lib/hydration';

// Mock the hydration utilities
vi.mock('@/lib/hydration', async () => {
  const actual = await vi.importActual('@/lib/hydration');
  return {
    ...actual,
    initializeHydrationHandling: vi.fn(),
    cleanupBrowserExtensions: vi.fn(),
    detectBrowserExtensions: vi.fn(),
    showExtensionWarning: vi.fn(),
    isHydrationError: vi.fn(),
    analyzeHydrationError: vi.fn(),
  };
});

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

describe('Hydration Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();

    // Mock window object
    Object.defineProperty(window, 'document', {
      value: {
        documentElement: {
          hasAttribute: vi.fn().mockReturnValue(false),
          removeAttribute: vi.fn(),
        },
        body: {
          hasAttribute: vi.fn().mockReturnValue(false),
          removeAttribute: vi.fn(),
        },
        querySelectorAll: vi.fn().mockReturnValue([]),
        createElement: vi.fn().mockReturnValue({
          style: {},
          innerHTML: '',
          parentElement: {
            removeChild: vi.fn(),
          },
        }),
        body: {
          appendChild: vi.fn(),
        },
        readyState: 'complete',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, 'MutationObserver', {
      value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      })),
      writable: true,
    });

    Object.defineProperty(window, 'setTimeout', {
      value: vi.fn().mockImplementation((fn, delay) => {
        return setTimeout(fn, delay);
      }),
      writable: true,
    });

    Object.defineProperty(window, 'setInterval', {
      value: vi.fn().mockImplementation((fn, delay) => {
        return setInterval(fn, delay);
      }),
      writable: true,
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    vi.restoreAllMocks();
  });

  describe('HydrationInitializer', () => {
    it('should render without crashing', () => {
      render(<HydrationInitializer />);
      // HydrationInitializer doesn't render anything, so we just verify it doesn't crash
      expect(document.body).toBeEmptyDOMElement();
    });

    it('should initialize hydration handling on mount', () => {
      render(<HydrationInitializer />);

      expect(hydrationUtils.initializeHydrationHandling).toHaveBeenCalledTimes(1);
    });

    it('should detect browser extensions', () => {
      const mockExtensions = [
        {
          name: 'Grammarly',
          detected: true,
          elements: ['[data-grammarly-shadow]'],
          attributes: [],
          warnings: ['May cause hydration issues'],
        },
      ];

      vi.mocked(hydrationUtils.detectBrowserExtensions).mockReturnValue(mockExtensions);

      render(<HydrationInitializer />);

      // Should detect extensions after a delay
      setTimeout(() => {
        expect(hydrationUtils.detectBrowserExtensions).toHaveBeenCalled();
        expect(hydrationUtils.showExtensionWarning).toHaveBeenCalledWith(mockExtensions);
      }, 100);
    });

    it('should set up mutation observer for DOM changes', () => {
      render(<HydrationInitializer />);

      expect(window.MutationObserver).toHaveBeenCalled();
    });

    it('should clean up on unmount', () => {
      const { unmount } = render(<HydrationInitializer />);

      unmount();

      // Should clean up observers and intervals
      expect(vi.mocked(window.MutationObserver).mock.results[0].value.disconnect).toHaveBeenCalled();
    });
  });

  describe('HydrationBoundary', () => {
    it('should render children after hydration', async () => {
      const TestComponent = () => <div>Test Content</div>;

      render(
        <HydrationBoundary>
          <TestComponent />
        </HydrationBoundary>
      );

      // Initially shows hidden placeholder
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should show fallback when provided', async () => {
      const TestComponent = () => <div>Test Content</div>;
      const FallbackComponent = () => <div>Loading...</div>;

      render(
        <HydrationBoundary fallback={<FallbackComponent />}>
          <TestComponent />
        </HydrationBoundary>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should clean up browser extensions during hydration', async () => {
      render(
        <HydrationBoundary>
          <div>Test Content</div>
        </HydrationBoundary>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(hydrationUtils.cleanupBrowserExtensions).toHaveBeenCalled();
    });

    it('should handle multiple cleanup attempts', async () => {
      render(
        <HydrationBoundary>
          <div>Test Content</div>
        </HydrationBoundary>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      // Should call cleanup multiple times for aggressive extensions
      expect(hydrationUtils.cleanupBrowserExtensions).toHaveBeenCalledTimes(3);
    });
  });

  describe('HydrationErrorBoundary', () => {
    it('should render children normally', () => {
      const TestComponent = () => <div>Normal Content</div>;

      render(
        <HydrationErrorBoundary>
          <TestComponent />
        </HydrationErrorBoundary>
      );

      expect(screen.getByText('Normal Content')).toBeInTheDocument();
    });

    it('should handle hydration errors gracefully', () => {
      const ThrowHydrationError = () => {
        throw new Error('Hydration failed: text content does not match');
      };

      vi.mocked(hydrationUtils.isHydrationError).mockReturnValue(true);
      vi.mocked(hydrationUtils.analyzeHydrationError).mockReturnValue({
        isHydration: true,
        severity: 'high',
        likelyCause: 'Browser extension modifying DOM',
        suggestions: ['Disable extension'],
      });

      render(
        <HydrationErrorBoundary>
          <ThrowHydrationError />
        </HydrationErrorBoundary>
      );

      // Should show hidden fallback instead of error
      expect(screen.queryByText('Hydration failed')).not.toBeInTheDocument();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('HydrationErrorBoundary: HIGH Hydration Error')
      );
    });

    it('should pass non-hydration errors to parent ErrorBoundary', () => {
      const ThrowNormalError = () => {
        throw new Error('Normal error');
      };

      vi.mocked(hydrationUtils.isHydrationError).mockReturnValue(false);

      expect(() => {
        render(
          <HydrationErrorBoundary>
            <ThrowNormalError />
          </HydrationErrorBoundary>
        );
      }).toThrow('Normal error');
    });

    it('should show development banner for hydration errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const ThrowHydrationError = () => {
        throw new Error('bis_skin_detected');
      };

      vi.mocked(hydrationUtils.isHydrationError).mockReturnValue(true);
      vi.mocked(hydrationUtils.analyzeHydrationError).mockReturnValue({
        isHydration: true,
        severity: 'medium',
        likelyCause: 'BIS extension',
        suggestions: ['Disable BIS'],
      });

      render(
        <HydrationErrorBoundary>
          <ThrowHydrationError />
        </HydrationErrorBoundary>
      );

      // Should create and show development banner
      expect(document.createElement).toHaveBeenCalledWith('div');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Integration Tests', () => {
    it('should work together in root layout', async () => {
      const TestApp = () => (
        <div>
          <HydrationInitializer />
          <HydrationErrorBoundary>
            <HydrationBoundary>
              <div>App Content</div>
            </HydrationBoundary>
          </HydrationErrorBoundary>
        </div>
      );

      render(<TestApp />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(screen.getByText('App Content')).toBeInTheDocument();
      expect(hydrationUtils.initializeHydrationHandling).toHaveBeenCalled();
    });

    it('should handle complex component trees', async () => {
      const ComplexComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Content</p>
          <button>Action</button>
        </div>
      );

      render(
        <HydrationErrorBoundary>
          <HydrationBoundary>
            <HydrationInitializer />
            <ComplexComponent />
          </HydrationBoundary>
        </HydrationErrorBoundary>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should prevent hydration errors from browser extensions', () => {
      // Mock browser extension modifications
      const mockElement = {
        hasAttribute: vi.fn().mockReturnValue(true),
        removeAttribute: vi.fn(),
      };

      vi.mocked(document.documentElement).hasAttribute.mockReturnValue(true);
      vi.mocked(document.body).hasAttribute.mockReturnValue(true);

      render(
        <HydrationBoundary>
          <HydrationInitializer />
          <div>Content</div>
        </HydrationBoundary>
      );

      // Should clean up extension attributes
      expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('bis_skin_checked');
      expect(document.body.removeAttribute).toHaveBeenCalledWith('bis_skin_checked');
    });
  });
});
