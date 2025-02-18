import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
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

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.isLoading).toBe(false);
    // clearAuth should be an async function
    expect(result.current.clearAuth).toBeInstanceOf(Function);
    expect(result.current.clearAuth()).toBeInstanceOf(Promise);
  });

  it('should detect token in localStorage', async () => {
    // Set up token in localStorage before rendering hook
    const token = 'test-token';
    mockStorage['auth_token'] = token;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(token);
  });

  it('should clear auth state on clearAuth', async () => {
    // Set up token in localStorage before rendering hook
    const token = 'test-token';
    mockStorage['auth_token'] = token;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(token);

    await act(async () => {
      await result.current.clearAuth();
      // Wait for query to settle
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.token });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(mockStorage['auth_token']).toBeUndefined();
    expect(queryClient.getQueryData(AUTH_KEYS.token)).toBeNull();
  });
});
