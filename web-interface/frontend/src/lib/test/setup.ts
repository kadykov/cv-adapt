import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Custom error handler to suppress expected test errors
const isExpectedError = (message: string): boolean => {
  const expectedPatterns = [
    'Invalid credentials',
    'Email already registered',
    'Invalid refresh token',
    'Unauthorized',
  ];
  return expectedPatterns.some(pattern => message.includes(pattern));
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
  cb?: (err?: Error) => void
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

// Clean up after each test
afterEach(() => {
  cleanup();
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Stub ResizeObserver for tests
global.ResizeObserver = ResizeObserverStub;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup MSW
import { server } from './server';
// Enable request debugging
beforeAll(() => server.listen({
  onUnhandledRequest: (req) => {
    console.error('Found an unhandled %s request to %s', req.method, req.url);
  }
}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Since we're using @testing-library/jest-dom, its matchers are automatically available
