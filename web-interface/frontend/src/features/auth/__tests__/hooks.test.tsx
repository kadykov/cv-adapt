import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockUser,
  mockAuthResponse,
  createWrapper,
  createTestQueryClient,
} from '../testing';
import { useRegisterMutation, useProfile, useRefreshToken } from '../hooks';
import { ApiError } from '../../../lib/api/client';

// Mock auth context
vi.mock('../context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: mockUser,
    login: vi.fn(),
    loginWithCredentials: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Auth Hooks', () => {
  describe('useRegisterMutation', () => {
    const successData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const errorData = {
      email: 'exists@example.com',
      password: 'password123',
    };

    it('should handle successful registration', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(successData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAuthResponse);
    });

    it('should handle registration error', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate(errorData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const error = result.current.error;
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toBe('Email already registered');
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('useProfile', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'test-access-token');
    });

    it('should fetch profile when authenticated', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(
        () => {
          expect(result.current.data).toEqual(mockUser);
        },
        { timeout: 2000 },
      );
    });

    it('should handle unauthorized error', async () => {
      localStorage.clear();
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const error = result.current.error;
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Unauthorized');
      }
    });
  });

  describe('useRefreshToken', () => {
    it('should handle successful token refresh', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('valid-refresh-token');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAuthResponse);
    });

    it('should handle refresh token error', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('invalid-refresh-token');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const error = result.current.error;
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid refresh token');
      }
    });
  });
});
