import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse } from '../../../validation/openapi';
import { ApiError } from '../../../api/core/api-error';
import { authService } from '../../../api/services/auth.service';
import type { LoginCredentials, RegistrationData } from '../types';

interface CookieOptions {
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  expires?: number | Date;
}

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
} as const;

// Cookie operations that only run on the client side
const cookieOps = {
  get: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const Cookies = (await import('js-cookie')).default;
      return Cookies.get(key) || null;
    } catch (e) {
      console.error('Cookie get operation failed:', e);
      return null;
    }
  },
  set: async (key: string, value: string, options: CookieOptions = COOKIE_OPTIONS): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const Cookies = (await import('js-cookie')).default;
      await Promise.resolve(Cookies.set(key, value, options));
    } catch (e) {
      console.error('Cookie set operation failed:', e);
    }
  },
  remove: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const Cookies = (await import('js-cookie')).default;
      await Promise.resolve(Cookies.remove(key, COOKIE_OPTIONS));
    } catch (e) {
      console.error('Cookie remove operation failed:', e);
    }
  }
};

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from cookies on mount (client-side only)
  useEffect(() => {
    const loadAuthState = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        const [storedUser, storedAccessToken] = await Promise.all([
          cookieOps.get('auth_user'),
          cookieOps.get('auth_token')
        ]);

        if (storedUser && storedAccessToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedAccessToken);
          } catch (error) {
            await Promise.all([
              cookieOps.remove('auth_token'),
              cookieOps.remove('auth_user'),
              cookieOps.remove('refresh_token')
            ]);
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
      const credentials: LoginCredentials = { email, password, remember };
      const response = await authService.login(credentials);

      await Promise.all([
        cookieOps.set('auth_token', response.access_token),
        cookieOps.set('auth_user', JSON.stringify(response.user))
      ]);

      if (remember) {
        await cookieOps.set('refresh_token', response.refresh_token);
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
      const registrationData: RegistrationData = { email, password, acceptTerms: true };
      const response = await authService.register(registrationData);

      await Promise.all([
        cookieOps.set('auth_token', response.access_token),
        cookieOps.set('auth_user', JSON.stringify(response.user)),
        cookieOps.set('refresh_token', response.refresh_token)
      ]);

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
      await Promise.all([
        cookieOps.remove('auth_token'),
        cookieOps.remove('auth_user'),
        cookieOps.remove('refresh_token')
      ]);
    }
  };

  const refreshToken = async (): Promise<void> => {
    const storedRefreshToken = await cookieOps.get('refresh_token');
    if (!storedRefreshToken) return;

    try {
      const response = await authService.refreshToken(storedRefreshToken);

      await Promise.all([
        cookieOps.set('auth_token', response.access_token),
        cookieOps.set('auth_user', JSON.stringify(response.user)),
        cookieOps.set('refresh_token', response.refresh_token)
      ]);

      setUser(response.user);
      setToken(response.access_token);
    } catch (error) {
      await logout();
    }
  };

  const value = React.useMemo(() => ({
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
