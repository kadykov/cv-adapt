import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiError } from '../../../api/core/api-error';
import { authService } from '../../../api/services/auth.service';
import type { AuthResponse, User } from '@/types/api';
import Cookies from 'js-cookie';

const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
  path: '/'
} as const;

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  register: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  refreshToken: async () => {
    throw new Error('AuthContext not initialized');
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from cookies on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedUser = Cookies.get('auth_user');
        const storedAccessToken = Cookies.get('auth_token');

        if (storedUser && storedAccessToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedAccessToken);
          } catch {
            Cookies.remove('auth_token', COOKIE_OPTIONS);
            Cookies.remove('auth_user', COOKIE_OPTIONS);
            Cookies.remove('refresh_token', COOKIE_OPTIONS);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (email: string, password: string, remember = false): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });

      Cookies.set('auth_token', response.access_token, COOKIE_OPTIONS);
      Cookies.set('auth_user', JSON.stringify(response.user), COOKIE_OPTIONS);

      if (remember) {
        Cookies.set('refresh_token', response.refresh_token, COOKIE_OPTIONS);
      }

      setUser(response.user);
      setToken(response.access_token);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('An unexpected error occurred', undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register({ email, password });

      Cookies.set('auth_token', response.access_token, COOKIE_OPTIONS);
      Cookies.set('auth_user', JSON.stringify(response.user), COOKIE_OPTIONS);
      Cookies.set('refresh_token', response.refresh_token, COOKIE_OPTIONS);

      setUser(response.user);
      setToken(response.access_token);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Registration failed', undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      Cookies.remove('auth_token', COOKIE_OPTIONS);
      Cookies.remove('auth_user', COOKIE_OPTIONS);
      Cookies.remove('refresh_token', COOKIE_OPTIONS);
    }
  };

  const refreshToken = async (): Promise<void> => {
    const storedRefreshToken = Cookies.get('refresh_token');
    if (!storedRefreshToken) return;

    try {
      const response = await authService.refreshToken(storedRefreshToken);

      Cookies.set('auth_token', response.access_token, COOKIE_OPTIONS);
      Cookies.set('auth_user', JSON.stringify(response.user), COOKIE_OPTIONS);
      Cookies.set('refresh_token', response.refresh_token, COOKIE_OPTIONS);

      setUser(response.user);
      setToken(response.access_token);
    } catch {
      await logout();
    }
  };

  const value = React.useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
