import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import {
  mockUser,
  mockAuthResponse,
  createWrapper,
  createTestQueryClient,
} from '../test-utils.tsx';
import { useRegisterMutation, useProfile, useRefreshToken } from '../hooks';
import { ApiError } from '../../../lib/api/client';
import { authHandlers } from './mocks';

// Initialize MSW with auth handlers
const server = setupServer(...authHandlers);

// Mock auth context
vi.mock('../context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: mockUser,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper(createTestQueryClient()),
      });

      result.current.mutate(successData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAuthResponse);
    });

    it('should handle registration error', async () => {
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper(createTestQueryClient()),
      });

      result.current.mutate(errorData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
      if (result.current.error instanceof ApiError) {
        expect(result.current.error.message).toBe('Email already registered');
      }
    });
  });

  describe('useProfile', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'test-access-token');
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should fetch profile when authenticated', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setDefaultOptions({
        queries: {
          retry: false,
        },
      });

      // Set up access token
      localStorage.setItem('accessToken', 'test-access-token');

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUser);
      });
    });

    it('should handle unauthorized error', async () => {
      // Clear token for unauthorized test
      localStorage.clear();
      server.resetHandlers();
      server.use(
        http.get('/v1/api/users/me', () => {
          return new HttpResponse(null, {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        })
      );

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(createTestQueryClient()),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
    });
  });

  describe('useRefreshToken', () => {
    it('should handle successful token refresh', async () => {
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(createTestQueryClient()),
      });

      result.current.mutate('old-refresh-token');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAuthResponse);
    });

    it('should handle refresh token error', async () => {
      server.resetHandlers();
      server.use(authHandlers[2]);

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(createTestQueryClient()),
      });

      result.current.mutate('invalid-refresh-token');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(ApiError);
      if (result.current.error instanceof ApiError) {
        expect(result.current.error.message).toBe('Invalid refresh token');
      }
    });
  });
});
