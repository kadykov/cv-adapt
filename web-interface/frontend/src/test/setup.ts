import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockApiMethods } from './service-mocks';
import React from 'react';
import type { LinkProps } from 'react-router-dom';

// Global test configuration
beforeAll(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock fetch
  global.fetch = vi.fn();

  // Mock router behavior
  vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
    useParams: () => ({}),
    Link: ({ children, to, ...props }: LinkProps) =>
      React.createElement('a', { href: to, ...props }, children),
  }));
});

// Reset all mocks and cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();

  // Clear API method calls
  Object.values(mockApiMethods).forEach(method => {
    method.mockClear();
  });

  // Clear fetch calls
  (global.fetch as any).mockClear();
});

// Configure global error handler
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out React-specific warnings we don't care about in tests
  const suppressed = [
    'Warning: ReactDOM.render is no longer supported',
    'Warning: useLayoutEffect does nothing on the server',
    'Warning: Invalid aria-props',
  ];

  if (!args.some(arg => suppressed.some(suppress => String(arg).includes(suppress)))) {
    originalConsoleError(...args);
  }
};

// Add custom matchers
expect.extend({
  toHaveLoadingState(received: Element, state: boolean) {
    const hasLoadingState = received.getAttribute('aria-busy') === String(state);
    return {
      message: () =>
        `expected ${received} to ${state ? 'be' : 'not be'} in loading state`,
      pass: hasLoadingState,
    };
  },
  toBeAccessible(element: Element) {
    const accessibilityIssues = [
      !element.hasAttribute('role') && !element.hasAttribute('aria-label'),
      element.getAttribute('aria-hidden') === 'true' && element.hasAttribute('tabindex'),
      element.hasAttribute('role') && !element.hasAttribute('aria-label'),
    ].filter(Boolean);

    return {
      message: () =>
        `expected element to be accessible but found issues: ${accessibilityIssues.join(', ')}`,
      pass: accessibilityIssues.length === 0,
    };
  },
});

// Add custom assertions to global
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveLoadingState(state: boolean): R;
      toBeAccessible(): R;
    }
  }

  interface Window {
    ResizeObserver: ResizeObserver;
    IntersectionObserver: IntersectionObserver;
  }
}

// Configure vitest timeouts
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Export test constants
export const TEST_TIMEOUT = 10000;
export const ASYNC_TIMEOUT = 1000;

// Export test utilities
export * from './helpers';
export * from './a11y-helpers';
export * from './service-mocks';
export { cleanup, render } from './test-utils';
