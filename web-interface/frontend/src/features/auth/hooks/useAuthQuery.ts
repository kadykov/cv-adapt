import { useQuery } from '@tanstack/react-query';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { authMutations } from '../services/auth-mutations';
import { tokenService } from '../services/token-service';

export const AUTH_QUERY_KEY = ['auth'] as const;

/**
 * Core hook that manages authentication state through React Query.
 * This provides a centralized way to access and manage auth state,
 * replacing the previous event-based system.
 */
export function useAuthQuery() {
  return useQuery<AuthResponse | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      // Always check for token first
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        return null;
      }
      try {
        const result = await authMutations.validateToken();
        return result;
      } catch (error) {
        console.error('Token validation failed:', error);
        return null;
      }
    },
    // Don't cache in test environment
    ...(process.env.NODE_ENV === 'test'
      ? { gcTime: 0, staleTime: 0 }
      : { gcTime: 60 * 1000, staleTime: 60 * 1000 }),
  });
}

/**
 * Helper hook that provides commonly needed auth state values.
 * This simplifies the auth state usage in components.
 */
export function useAuthState() {
  const { data, isLoading, error } = useAuthQuery();

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isLoading,
    error,
  };
}
