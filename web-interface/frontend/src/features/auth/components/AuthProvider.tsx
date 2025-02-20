import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../auth-context';
import type { AuthContextType } from '../auth-types';
import type { AuthResponse } from '../../../lib/api/generated-types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((response: AuthResponse) => {
    setUser(response.user);
    // Here we would also store the token in localStorage or secure storage
  }, []);

  const loginWithCredentials = useCallback(
    async (credentials: { email: string; password: string }) => {
      // This will be implemented to call the API
      console.log('Login with credentials:', credentials);
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    // Here we would also clear the token from storage
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Simulating initial auth check
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Here we would check for stored tokens and fetch user profile
        // For now, just simulate the check
        await new Promise((resolve) => setTimeout(resolve, 500));
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
