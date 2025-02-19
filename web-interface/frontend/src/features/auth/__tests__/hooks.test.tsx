import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWrapper, createTestQueryClient } from '../testing';
import { mockAuthResponse } from '../testing/fixtures';
import { useRegisterMutation, useProfile, useRefreshToken } from '../hooks';
import {
  mockRegisterMutation,
  mockUseProfile,
  mockRefreshTokenMutation,
} from '../testing/setup';
import { ApiError } from '../../../lib/api/client';

describe('Auth Hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset mutation states
    Object.assign(mockRegisterMutation, {
      isPending: false,
      error: null,
      isSuccess: false,
      isError: false,
      data: null,
    });

    Object.assign(mockRefreshTokenMutation, {
      isPending: false,
      error: null,
      isSuccess: false,
      isError: false,
      data: null,
    });

    Object.assign(mockUseProfile, {
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: false,
    });
  });

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

      Object.assign(mockRegisterMutation, {
        data: mockAuthResponse,
        isSuccess: true,
        error: null,
      });

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

      const error = new ApiError('Email already registered', 400);
      Object.assign(mockRegisterMutation, {
        error,
        isError: true,
        isSuccess: false,
      });

      result.current.mutate(errorData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
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

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUseProfile.data);
      });
    });

    it('should handle unauthorized error', async () => {
      localStorage.clear();
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClient),
      });

      const error = new ApiError('Unauthorized', 401);
      Object.assign(mockUseProfile, {
        error,
        isError: true,
      });

      await waitFor(() => {
        expect(result.current.error).toBe(error);
      });
    });
  });

  describe('useRefreshToken', () => {
    it('should handle successful token refresh', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(queryClient),
      });

      Object.assign(mockRefreshTokenMutation, {
        data: mockAuthResponse,
        isSuccess: true,
      });

      result.current.mutate('valid-refresh-token');

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAuthResponse);
      });
    });

    it('should handle refresh token error', async () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('invalid-refresh-token');

      const error = new ApiError('Invalid refresh token', 401);
      Object.assign(mockRefreshTokenMutation, {
        error,
        isError: true,
      });

      await waitFor(() => {
        expect(result.current.error).toBe(error);
      });
    });
  });
});
