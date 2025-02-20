import { useCallback, ReactNode, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse } from '../../lib/api/generated-types';
import { authApi } from '../../lib/api/auth';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Here we would validate token and fetch user profile
          // For now, just clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback((response: AuthResponse) => {
    setUser(response.user);
    // Store tokens
    localStorage.setItem('accessToken', response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
  }, []);

  const loginWithCredentials = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await authApi.login({
        username: credentials.email,
        password: credentials.password,
        scope: '',
        grant_type: 'password',
      });
      login(response);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    queryClient.clear(); // Clear all queries on logout
  }, [queryClient]);

  const value = {
    user,
    login,
    loginWithCredentials,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
