import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth, AUTH_KEYS } from '../useAuth';

describe('useAuth', () => {
  let mockStorage: { [key: string]: string } = {};

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Clear queryClient cache before each test
    queryClient.clear();

    // Reset storage mock data
    mockStorage = {};

    // Mock localStorage
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should return initial state with no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.clearAuth).toBeInstanceOf(Function);

    await waitFor(async () => {
      const clearResult = result.current.clearAuth();
      expect(clearResult).toBeInstanceOf(Promise);
      await expect(clearResult).resolves.toBeUndefined();
    });
  });

  it('should detect token in localStorage', async () => {
    // Set up token in localStorage before rendering hook
    const token = 'test-token';
    mockStorage['access_token'] = token;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(token);
  });

  it('should clear auth state on clearAuth', async () => {
    // Set up token in localStorage before rendering hook
    const token = 'test-token';
    mockStorage['access_token'] = token;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(token);

    // Clear auth and wait for state to update
    await waitFor(async () => {
      await result.current.clearAuth();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(mockStorage['access_token']).toBeUndefined();
    expect(queryClient.getQueryData(AUTH_KEYS.token)).toBeNull();
  });
});
