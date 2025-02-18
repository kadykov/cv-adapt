import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect, useState } from 'react';

export const AUTH_KEYS = {
  token: ['auth', 'token'] as const,
  profile: ['auth', 'profile'] as const,
} as const;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  clearAuth: () => Promise<void>;
}

/**
 * Hook for managing authentication state
 * Uses React Query for caching and automatic background updates
 */
export const useAuth = (): AuthState => {
  const queryClient = useQueryClient();
  const initialToken = localStorage.getItem('auth_token');
  const [isCleared, setIsCleared] = useState(false);
  const initialTokenRef = useRef<string | null>(initialToken);

  useEffect(() => {
    // Set initial query data
    queryClient.setQueryData(AUTH_KEYS.token, initialTokenRef.current);
  }, [queryClient]);

  const { data: token, isLoading } = useQuery<string | null>({
    queryKey: AUTH_KEYS.token,
    queryFn: () => {
      const storedToken = localStorage.getItem('auth_token');
      return storedToken;
    },
    // Keep token cached indefinitely until explicitly invalidated
    initialData: initialTokenRef.current,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  /**
   * Clears authentication state and removes token from storage
   * Used during logout
   */
  const clearAuth = useCallback(async () => {
    localStorage.removeItem('auth_token');
    queryClient.setQueryData(AUTH_KEYS.token, null);
    setIsCleared(true);
  }, [queryClient]);

  return {
    isAuthenticated: !isCleared && !!token,
    isLoading,
    token: isCleared ? null : token,
    clearAuth,
  };
};
