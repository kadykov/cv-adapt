import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { authMutations } from '../services/auth-mutations';
import { tokenService } from '../services/token-service';
import { AuthContext } from '../context/auth-context';
import type { AuthContextType } from '../auth-types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stateVersion, setStateVersion] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    // Cleanup function to handle unmounting
    return () => {
      mounted.current = false;
    };
  }, []);

  const login = useCallback(
    async (response: AuthResponse) => {
      if (!response?.user) {
        throw new Error('Invalid response from server');
      }
      tokenService.storeTokens(response);

      // Set user immediately from the login response
      if (mounted.current) {
        setUser(response.user);
        setStateVersion((v) => v + 1);
        // Invalidate all queries to ensure fresh data after login
        queryClient.invalidateQueries();
        // Notify all components about auth state change
        window.dispatchEvent(
          new CustomEvent('auth-state-change', {
            detail: { isAuthenticated: true, user: response.user },
          }),
        );
      }

      // Validate token in the background without blocking UI update
      try {
        const profile = await authMutations.validateToken();
        if (mounted.current && profile?.user) {
          // Update with the latest user data if different
          if (JSON.stringify(profile.user) !== JSON.stringify(response.user)) {
            setUser(profile.user);
          }
        }
      } catch (error) {
        // If validation fails, clear everything and throw
        tokenService.clearTokens();
        if (mounted.current) {
          setUser(null);
        }
        throw error;
      }
    },
    [queryClient],
  ); // queryClient needed since it's used in the callback

  const loginWithCredentials = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await authMutations.login(credentials);
      await login(response);
      return response;
    },
    [login], // queryClient not needed since we only use login
  );

  const logout = useCallback(async () => {
    // Clear state before API call
    if (mounted.current) {
      setUser(null);
      tokenService.clearTokens();
      setStateVersion((v) => v + 1);
      // Invalidate all queries to ensure fresh data after logout
      queryClient.invalidateQueries();
      // Remove all queries from the cache to prevent stale data
      queryClient.removeQueries();
      // Notify all components about auth state change
      window.dispatchEvent(
        new CustomEvent('auth-state-change', {
          detail: { isAuthenticated: false, user: null },
        }),
      );
    }

    // Now attempt the API call, but don't wait for it and handle any errors
    authMutations.logout().catch(() => {
      // Ignore logout errors - state is already cleared
    });
  }, [queryClient]); // Add queryClient dependency since it's used in the callback

  // Initialize auth state and watch for token changes
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const checkAuth = async () => {
      if (!mounted) return;

      try {
        setIsLoading(true);

        // First check if we have tokens
        const tokens = tokenService.getStoredTokens();
        if (!tokens) {
          if (mounted) {
            setUser(null);
          }
          return;
        }

        // Validate tokens with backend
        const authState = await authMutations.validateToken();

        if (!mounted) return;

        if (authState?.user) {
          setUser(authState.user);
          setStateVersion((v) => v + 1);
          window.dispatchEvent(
            new CustomEvent('auth-state-change', {
              detail: { isAuthenticated: true },
            }),
          );
          // Update stored tokens in case they were refreshed
          tokenService.storeTokens(authState);
        } else {
          setUser(null);
          setStateVersion((v) => v + 1);
          window.dispatchEvent(
            new CustomEvent('auth-state-change', {
              detail: { isAuthenticated: false },
            }),
          );
          tokenService.clearTokens();
        }
      } catch {
        if (mounted) {
          setUser(null);
          setStateVersion((v) => v + 1);
          window.dispatchEvent(
            new CustomEvent('auth-state-change', {
              detail: { isAuthenticated: false },
            }),
          );
          tokenService.clearTokens();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted) return;
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        // Only check if the token actually changed
        const currentToken = tokenService.getAccessToken();
        const newToken = e.newValue;

        if (currentToken !== newToken) {
          void checkAuth();
        }
      }
    };

    // Initial auth check
    void checkAuth();

    // Set up listeners for token changes
    window.addEventListener('storage', handleStorageChange);

    // Set up periodic validation (skip in test environment)
    const validateInterval =
      process.env.NODE_ENV !== 'test'
        ? setInterval(() => {
            if (mounted) {
              void checkAuth();
            }
          }, 60000)
        : undefined;

    // Cleanup
    return () => {
      mounted = false;
      abortController.abort();
      window.removeEventListener('storage', handleStorageChange);
      if (validateInterval) {
        clearInterval(validateInterval);
      }
    };
  }, [queryClient]); // Run only once on mount, manage state internally

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      loginWithCredentials,
      logout,
      isAuthenticated: !!user,
      isLoading,
      stateVersion,
    }),
    [user, login, loginWithCredentials, logout, isLoading, stateVersion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
