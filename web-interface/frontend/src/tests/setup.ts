import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window properties needed for React and testing-library
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

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  },
});

// Mock window event handlers
Object.defineProperty(window, 'event', {
  writable: true,
  value: {},
});
