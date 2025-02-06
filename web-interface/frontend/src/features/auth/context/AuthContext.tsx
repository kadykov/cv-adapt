import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthState, User } from "../types";
import * as authApi from "../api/auth.api";

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Handle invalid stored data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.token) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await authApi.refreshToken(state.token!);
        updateAuthState(response.user, response.access_token);
      } catch (error) {
        // If refresh fails, log user out
        handleLogout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [state.token]);

  const updateAuthState = (user: User, token: string, remember = false) => {
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  };

  const handleLogin = async (email: string, password: string, remember = false) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.login({ email, password, remember });
      updateAuthState(response.user, response.access_token, remember);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.register({ email, password, acceptTerms: true });
      updateAuthState(response.user, response.access_token, true);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleLogout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const value = {
    ...state,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
