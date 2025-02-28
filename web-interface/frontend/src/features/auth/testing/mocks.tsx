import { vi } from 'vitest';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { AUTH_QUERY_KEY } from '../hooks/useAuthQuery';
import { QueryClient } from '@tanstack/react-query';

// Create initial mock user
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  personal_info: null,
};

// Create mock auth response
export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
};

// Mock functions for mutations
export const mockLoginMutation = vi.fn();
export const mockRegisterMutation = vi.fn();
export const mockLogoutMutation = vi.fn();

// Mock hook responses
export const createAuthQueryResult = (data: AuthResponse | null = null) => ({
  data,
  isLoading: false,
  error: null,
});

export const createLoginMutationResult = (
  onSuccess?: (data: AuthResponse) => void,
) => ({
  mutate: mockLoginMutation,
  isPending: false,
  error: null,
  onSuccess,
});

export const createRegisterMutationResult = (
  onSuccess?: (data: AuthResponse) => void,
) => ({
  mutate: mockRegisterMutation,
  isPending: false,
  error: null,
  onSuccess,
});

export const createLogoutMutationResult = (onSuccess?: () => void) => ({
  mutate: mockLogoutMutation,
  isPending: false,
  error: null,
  onSuccess,
});

// Helper to create mock auth state
export const createMockAuthState = (isAuthenticated = false) => ({
  user: isAuthenticated ? mockUser : null,
  isAuthenticated,
  isLoading: false,
  error: null,
});

// Mock for query client
export const createMockQueryClient = (
  initialData: AuthResponse | null = null,
) => ({
  setQueryData: vi.fn(),
  getQueryData: vi.fn(() => initialData),
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
  getQueryState: vi.fn(() => ({
    data: initialData,
    status: 'success',
  })),
});

// Mock for default unauthenticated state
export const defaultMockQueryClient = createMockQueryClient();

// Helper to set up auth test state
export const setupAuthTestState = (
  queryClient: QueryClient,
  isAuthenticated = false,
) => {
  if (isAuthenticated) {
    queryClient.setQueryData(AUTH_QUERY_KEY, mockAuthResponse);
  } else {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }
  return queryClient;
};
