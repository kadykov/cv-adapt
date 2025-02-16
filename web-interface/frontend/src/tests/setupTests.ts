import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi, Mock } from 'vitest';
import { server } from './mocks/server';

// Mock console.error to avoid noisy console output during tests
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render is no longer supported')
  ) {
    return;
  }
  consoleError(...args);
};

interface MockMatchMedia {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: Mock;
  removeListener: Mock;
  addEventListener: Mock;
  removeEventListener: Mock;
  dispatchEvent: Mock;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MockMatchMedia => ({
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
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Setup MSW
beforeAll(() => {
  // Enable the mocking in tests
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Reset any runtime handlers tests may use
  server.resetHandlers();
  // Clear localStorage
  localStorage.clear();
});

afterAll(() => {
  // Clean up after the tests are finished
  server.close();

  // Restore console.error
  console.error = consoleError;
});

// Mock localStorage with proper types
interface StorageItem {
  [key: string]: string;
}

const localStorageMock = (() => {
  let store: StorageItem = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    length: 0,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    key: (index: number): string | null => null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});
