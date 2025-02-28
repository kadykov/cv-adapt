import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

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
  const initialToken = localStorage.getItem('access_token');
  const [isCleared, setIsCleared] = useState(false);

  // Initialize query data without effect
  const initialized = useRef(false);
  if (!initialized.current) {
    queryClient.setQueryData(AUTH_KEYS.token, initialToken);
    initialized.current = true;
  }

  const { data: token, isLoading } = useQuery({
    queryKey: AUTH_KEYS.token,
    queryFn: (): string | null => localStorage.getItem('access_token'),
    enabled: initialized.current,
    // Ensure we always have initial data
    placeholderData: initialToken,
    initialData: initialToken,
    // Keep token cached indefinitely until explicitly invalidated
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
    localStorage.removeItem('access_token');
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
