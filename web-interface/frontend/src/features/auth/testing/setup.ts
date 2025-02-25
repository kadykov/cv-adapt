import { vi } from 'vitest';
import { createContext } from 'react';
import type { AuthContextType } from '../auth-types';
import { mockUser, mockAuthResponse } from './fixtures';
import type { ApiError } from '../../../lib/api/client';

// Create a mock context
export const MockAuthContext = createContext<AuthContextType | null>(null);

// Mock hooks
export const mockRegisterMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null as null | ApiError,
  isSuccess: false,
  isError: false,
  data: mockAuthResponse,
};

export const mockRefreshTokenMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null as null | ApiError,
  isSuccess: false,
  isError: false,
  data: mockAuthResponse,
};

export const mockUseProfile = {
  data: mockUser,
  error: null as null | ApiError,
  isError: false,
  isLoading: false,
  isSuccess: false,
};

// Default mock values for useAuth
export const mockAuthContextValue: AuthContextType = {
  isAuthenticated: false,
  user: mockUser,
  login: vi.fn(),
  loginWithCredentials: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  stateVersion: 0,
};

// Mock auth-context
export const mockAuthContext = {
  AuthContext: MockAuthContext,
  useAuth: () => mockAuthContextValue,
};

// Mock hooks
vi.mock('../hooks/index', () => ({
  useRegisterMutation: () => mockRegisterMutation,
  useProfile: () => mockUseProfile,
  useRefreshToken: () => mockRefreshTokenMutation,
  useAuth: () => mockAuthContextValue,
}));

// Mock auth-context
vi.mock('../context/auth-context', () => mockAuthContext);

// Add ResizeObserver mock
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
