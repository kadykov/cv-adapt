import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '../../api/services/AuthService';
import { ApiError } from '../../api/core/ApiError';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authService = new AuthService();

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      // TODO: Fetch user profile
      setUser({ email: 'test@example.com' }); // Temporary placeholder
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      setIsAuthenticated(true);
      setUser({ email: response.user.email });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    }
  }, []);

  const value = {
    isAuthenticated,
    user,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
