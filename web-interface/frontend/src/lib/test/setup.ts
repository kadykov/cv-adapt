import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './server';
import '../../features/auth/testing/setup';

// Add Jest-DOM matchers
expect.extend(matchers);

// Custom error handler to suppress expected test errors
const isExpectedError = (message: string): boolean => {
  const expectedPatterns = [
    // Authentication and validation errors
    'Invalid credentials',
    'Email already registered',
    'Invalid refresh token',
    'Unauthorized',

    // Form and API operation errors
    'Failed to create job',
    'Form submission failed',
    'Login failed',
    'Token validation failed',
    'Failed to generate CV',
    'Failed to generate competences',

    // React warnings
    'React does not recognize',
    'Invalid DOM property',
    'Not implemented:',
    'Please upgrade to at least react-dom',
    'test was not wrapped in act',

    // React Query warnings
    'No queryFn',
  ];
  return expectedPatterns.some((pattern) => message.includes(pattern));
};

// Override console.error to suppress expected test errors
const originalConsoleError = console.error;
console.error = (...args: Parameters<typeof console.error>) => {
  const message = args.join(' ');
  if (!isExpectedError(message)) {
    originalConsoleError(...args);
  }
};

// Override process.stderr.write to suppress expected test errors
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function (
  buffer: string | Uint8Array,
  encoding?: BufferEncoding | ((err?: Error) => void),
  cb?: (err?: Error) => void,
): boolean {
  const message = String(buffer);
  if (!isExpectedError(message)) {
    if (typeof encoding === 'function') {
      return originalStderrWrite(buffer, encoding);
    }
    return originalStderrWrite(buffer, encoding, cb);
  }
  return true;
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
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

  // Mock IntersectionObserver
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  });

  // Mock ResizeObserver
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class ResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  });
});

afterAll(() => {
  server.close();
  console.error = originalConsoleError;
  process.stderr.write = originalStderrWrite;
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
