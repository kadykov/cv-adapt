import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Enable API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: (req) => {
      console.warn(`Found an unhandled ${req.method} request to ${req.url}\n`);
    },
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Suppress React warnings we can't control
  const originalConsoleError = console.error;
  console.error = (...args: Parameters<typeof console.error>) => {
    const firstArg = args[0];
    if (
      typeof firstArg === 'string' &&
      (firstArg.includes('Warning: ReactDOM.render') ||
        firstArg.includes('inside a test was not wrapped in act'))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
});

// Reset request handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Custom error handler to suppress expected test errors
const isExpectedError = (message: string): boolean => {
  const expectedPatterns = [
    'Invalid credentials',
    'Email already registered',
    'Invalid refresh token',
    'Unauthorized',
    'Failed to create job',
    'Form submission failed',
    'Login failed',
    'Simulated error in auth flow',
    'Simulated error',
    'Test Error',
    'The above error occurred in the <ErrorComponent> component',
    '[LanguageAdapter]: Failed to handle API language',
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
