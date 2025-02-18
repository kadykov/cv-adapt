import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

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
