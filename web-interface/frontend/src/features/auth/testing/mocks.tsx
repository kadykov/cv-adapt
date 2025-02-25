import { createContext } from 'react';
import { vi } from 'vitest';
import type { AuthContextType } from '../auth-types';
import { mockUser } from './fixtures';

// Create a mock context
export const MockAuthContext = createContext<AuthContextType | null>(null);

// Create mock functions
export const mockLogin = vi.fn();
export const mockLoginWithCredentials = vi.fn();
export const mockLogout = vi.fn();

// Default mock values for useAuth
export const mockAuthContextValue: AuthContextType = {
  isAuthenticated: false,
  user: mockUser,
  login: mockLogin,
  loginWithCredentials: mockLoginWithCredentials,
  logout: mockLogout,
  isLoading: false,
  stateVersion: 0,
};

// Mock implementation for auth-context
export const mockAuthContext = {
  AuthContext: MockAuthContext,
  useAuth: () => mockAuthContextValue,
};
