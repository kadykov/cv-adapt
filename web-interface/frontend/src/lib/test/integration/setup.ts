import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// Mock ResizeObserver for Headless UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
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
