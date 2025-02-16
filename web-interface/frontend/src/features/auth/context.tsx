import { createContext, useContext, useCallback, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginRequest, UserResponse, authApi } from '../../lib/api/auth';

interface AuthContextType {
  user: UserResponse | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserResponse | null>(null);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
    // Store tokens or handle as needed
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    queryClient.clear(); // Clear all queries on logout
  }, [queryClient]);

  const value = {
    user,
    login,
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
