import { createContext, useContext, useCallback, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse } from '../../lib/api/types';
import { authApi } from '../../lib/api/auth';

export interface AuthContextType {
  user: AuthResponse['user'] | null;
  login: (response: AuthResponse) => void;
  loginWithCredentials: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  const login = useCallback((response: AuthResponse) => {
    setUser(response.user);
    // Store tokens
    localStorage.setItem('accessToken', response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
  }, []);

  const loginWithCredentials = useCallback(async (credentials: { email: string; password: string }) => {
    const response = await authApi.login(credentials);
    login(response);
  }, [login]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
