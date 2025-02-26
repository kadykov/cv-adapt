import { vi, expect, describe, beforeEach, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import type { AuthResponse } from '../../../../lib/api/generated-types';
import { useAuthQuery } from '../useAuthQuery';
import { authMutations } from '../../services/auth-mutations';
import { tokenService } from '../../services/token-service';

describe('Auth Hooks', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null,
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
  };

  // Set up mocks
  const getAccessToken = vi.spyOn(tokenService, 'getAccessToken');
  const validateToken = vi.spyOn(authMutations, 'validateToken');

  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Create a fresh QueryClient with test settings
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          refetchOnMount: true,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    });

    // Reset mocks and query cache
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useAuthQuery', () => {
    it('returns null when not authenticated', async () => {
      // Arrange
      getAccessToken.mockReturnValue(null);

      // Act
      const rendered = renderHook(() => useAuthQuery(), { wrapper });

      // Wait for query to settle
      await act(async () => {
        await vi.waitFor(() => {
          expect(rendered.result.current.isLoading).toBe(false);
          expect(rendered.result.current.isSuccess).toBe(true);
        });
      });

      // Assert
      expect(getAccessToken).toHaveBeenCalled();
      expect(validateToken).not.toHaveBeenCalled();
      expect(rendered.result.current.data).toBeNull();
    });

    it('returns user data when authenticated', async () => {
      // Arrange
      getAccessToken.mockReturnValue('mock-token');
      validateToken.mockResolvedValue(mockAuthResponse);

      // Act
      const rendered = renderHook(() => useAuthQuery(), { wrapper });

      // Wait for query to settle
      await act(async () => {
        await vi.waitFor(() => {
          expect(rendered.result.current.isLoading).toBe(false);
          expect(rendered.result.current.isSuccess).toBe(true);
        });
      });

      // Assert
      expect(getAccessToken).toHaveBeenCalled();
      expect(validateToken).toHaveBeenCalled();
      expect(rendered.result.current.data).toEqual(mockAuthResponse);
    });

    it('handles validation errors gracefully', async () => {
      // Arrange
      getAccessToken.mockReturnValue('mock-token');
      validateToken.mockRejectedValue(new Error('Validation failed'));

      // Act
      const rendered = renderHook(() => useAuthQuery(), { wrapper });

      // Wait for query to settle
      await act(async () => {
        await vi.waitFor(() => {
          expect(rendered.result.current.isLoading).toBe(false);
          expect(rendered.result.current.isError).toBe(false); // Should not be error because we catch it
          expect(rendered.result.current.isSuccess).toBe(true);
        });
      });

      // Assert
      expect(getAccessToken).toHaveBeenCalled();
      expect(validateToken).toHaveBeenCalled();
      expect(rendered.result.current.data).toBeNull();
    });

    it('shows correct loading states', async () => {
      // Arrange
      getAccessToken.mockReturnValue('mock-token');
      validateToken.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return mockAuthResponse;
      });

      // Act
      const rendered = renderHook(() => useAuthQuery(), { wrapper });

      // Assert initial loading state
      expect(rendered.result.current.isLoading).toBe(true);
      expect(rendered.result.current.isFetching).toBe(true);

      // Wait for query to settle
      await act(async () => {
        await vi.waitFor(() => {
          expect(rendered.result.current.isLoading).toBe(false);
          expect(rendered.result.current.isSuccess).toBe(true);
        });
      });

      // Assert final state
      expect(rendered.result.current.data).toEqual(mockAuthResponse);
      expect(rendered.result.current.isFetching).toBe(false);
    });
  });
});
