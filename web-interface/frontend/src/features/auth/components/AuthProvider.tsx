import { ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthQuery } from '../hooks';
import { tokenService } from '../services/token-service';
import { AUTH_QUERY_KEY } from '../hooks/useAuthQuery';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider initializes the auth query and handles token storage
 * synchronization between browser tabs.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize the auth query
  useAuthQuery();
  const queryClient = useQueryClient();

  // Handle token storage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        // Only invalidate if the token actually changed
        const currentToken = tokenService.getAccessToken();
        const newToken = e.newValue;

        if (currentToken !== newToken) {
          // Force a refetch of auth state
          void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  return <>{children}</>;
}
