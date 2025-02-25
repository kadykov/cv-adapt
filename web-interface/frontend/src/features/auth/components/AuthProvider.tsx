import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { authMutations } from '../services/auth-mutations';
import { tokenService } from '../services/token-service';
import { AuthContext } from '../context/auth-context';
import type { AuthContextType } from '../auth-types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    // Cleanup function to handle unmounting
    return () => {
      mounted.current = false;
    };
  }, []);

  const login = useCallback(async (response: AuthResponse) => {
    if (!response?.user) {
      throw new Error('Invalid response from server');
    }
    tokenService.storeTokens(response);

    // Verify token is valid by making a profile request
    try {
      const profile = await authMutations.validateToken();
      if (mounted.current) {
        if (profile?.user) {
          setUser(profile.user);
        } else {
          throw new Error('Failed to validate token');
        }
      }
    } catch (error) {
      // If validation fails, clear everything
      tokenService.clearTokens();
      if (mounted.current) {
        setUser(null);
      }
      throw error;
    }
  }, []);

  const loginWithCredentials = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await authMutations.login(credentials);
      await login(response);
      return response;
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authMutations.logout();
    } catch {
      // Ignore logout errors
    } finally {
      if (mounted.current) {
        setUser(null);
        tokenService.clearTokens();
      }
    }
  }, []);

  // Initialize auth state and watch for token changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await authMutations.validateToken();
        if (mounted.current) {
          if (authState?.user) {
            setUser(authState.user);
            tokenService.storeTokens(authState);
          } else {
            setUser(null);
            tokenService.clearTokens();
          }
        }
      } catch {
        if (mounted.current) {
          setUser(null);
          tokenService.clearTokens();
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial check
    setIsLoading(true);
    checkAuth();

    // Watch for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      loginWithCredentials,
      logout,
      isAuthenticated: !!user,
      isLoading,
    }),
    [user, login, loginWithCredentials, logout, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
