import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse } from '../../../validation/openapi';
import { ApiError } from '../../../api/core/api-error';
import { authService } from '../../../api/services/auth.service';
import type { LoginCredentials, RegistrationData } from '../types';

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
  const [isLoading, setIsLoading] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string, remember = false): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const credentials: LoginCredentials = { email, password, remember };
      const response = await authService.login(credentials);
      setUser(response.user);
      setToken(response.access_token);

      if (remember) {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

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
      setUser(response.user);
      setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const refreshToken = async (): Promise<void> => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) return;

    try {
      const response = await authService.refreshToken(storedToken);
      setUser(response.user);
      setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      await logout();
    }
  };

  useEffect(() => {
    refreshToken();
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

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
