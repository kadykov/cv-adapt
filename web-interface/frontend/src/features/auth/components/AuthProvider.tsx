import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../auth-context';
import type { AuthContextType } from '../auth-types';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { tokenService } from '../services/token-service';
import { useLoginMutation } from '../hooks';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((response: AuthResponse) => {
    setUser(response.user);
    tokenService.storeTokens(response);
  }, []);

  const { mutateAsync: loginMutation } = useLoginMutation();

  const loginWithCredentials = useCallback(
    async (credentials: { email: string; password: string }) => {
      await loginMutation(credentials);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    setUser(null);
    tokenService.clearTokens();
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Simulating initial auth check
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = tokenService.getAccessToken();
        if (!token) {
          return;
        }

        // TODO: Fetch user profile using token
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
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
