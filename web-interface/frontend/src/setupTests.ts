import type {} from 'vitest';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for API tests
const mockedFetch = vi.fn();
vi.stubGlobal('fetch', mockedFetch);

beforeEach(() => {
  mockedFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});
