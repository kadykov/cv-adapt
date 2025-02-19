import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { RegisterRequest } from '../../lib/api/generated-types';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { useAuth } from './context';

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onError: (error: ApiError) => {
      // Handle registration errors
      console.error('Registration failed:', error.message);
    },
  });
}

export function useProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.statusCode === 401) {
        return false; // Don't retry on unauthorized
      }
      return failureCount < 3;
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (token: string) => authApi.refresh({ token }),
    onError: (error: ApiError) => {
      if (error.statusCode === 401) {
        // Handle token refresh failure
        console.error('Token refresh failed:', error.message);
      }
    },
  });
}

// Helper hook to automatically refresh token
export function useTokenRefresh() {
  const refreshMutation = useRefreshToken();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        refreshMutation.mutate(refreshToken);
      }
    }, 1000 * 60 * 14); // Refresh token every 14 minutes (assuming 15-minute token expiry)

    return () => clearInterval(refreshInterval);
  }, [user, refreshMutation]);
}
