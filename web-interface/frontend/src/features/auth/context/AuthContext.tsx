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

    console.log('[Auth Context] Initializing with stored data:', {
      hasToken: !!token,
      hasUserJson: !!userJson
    });

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        console.log('[Auth Context] Successfully restored auth state');
      } catch (error) {
        console.error('[Auth Context] Error restoring auth state:', error);
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

    console.log('[Auth Context] Setting up token refresh interval');

    const refreshInterval = setInterval(async () => {
      try {
        console.log('[Auth Context] Attempting token refresh');
        const response = await authApi.refreshToken(state.token!);
        updateAuthState(response.user, response.access_token);
        console.log('[Auth Context] Token refresh successful');
      } catch (error) {
        console.error('[Auth Context] Token refresh failed:', error);
        // If refresh fails, log user out
        handleLogout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [state.token]);

  const updateAuthState = (user: User, token: string, remember = false) => {
    console.log('[Auth Context] Updating auth state:', {
      user,
      token: token ? '(present)' : '(none)',
      remember
    });

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    if (remember) {
      console.log('[Auth Context] Persisting auth state to localStorage');
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  };

  const handleLogin = async (email: string, password: string, remember = false) => {
    console.log('[Auth Context] Login attempt:', { email, remember });
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('[Auth Context] Calling login API');
      const response = await authApi.login({ email, password, remember });
      console.log('[Auth Context] Login API successful, updating state');
      updateAuthState(response.user, response.access_token, remember);
    } catch (error) {
      console.error('[Auth Context] Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string) => {
    console.log('[Auth Context] Registration attempt:', { email });
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('[Auth Context] Calling register API');
      const response = await authApi.register({ email, password, acceptTerms: true });
      console.log('[Auth Context] Registration successful, updating state');
      updateAuthState(response.user, response.access_token, true);
    } catch (error) {
      console.error('[Auth Context] Registration error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleLogout = async () => {
    console.log('[Auth Context] Logout initiated');
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await authApi.logout();
      console.log('[Auth Context] Logout API call successful');
    } catch (error) {
      console.error('[Auth Context] Logout API error:', error);
    } finally {
      console.log('[Auth Context] Cleaning up local auth state');
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
