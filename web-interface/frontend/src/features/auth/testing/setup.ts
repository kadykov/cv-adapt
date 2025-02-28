import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from '../../../lib/api/client';
import {
  mockAuthResponse,
  createAuthQueryResult,
  createLoginMutationResult,
  createRegisterMutationResult,
  createLogoutMutationResult,
} from './mocks';

// Create test QueryClient
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

// Mock mutations with default state
export const mockLoginMutation = {
  ...createLoginMutationResult(),
  mutateAsync: vi.fn(),
  isSuccess: false,
  isError: false,
  data: null,
};

export const mockRegisterMutation = {
  ...createRegisterMutationResult(),
  mutateAsync: vi.fn(),
  isSuccess: false,
  isError: false,
  data: null,
};

export const mockLogoutMutation = {
  ...createLogoutMutationResult(),
  mutateAsync: vi.fn(),
  isSuccess: false,
  isError: false,
};

export const mockAuthQuery = {
  ...createAuthQueryResult(null),
  isSuccess: false,
  isError: false,
  error: null as null | ApiError,
};

// Mock hooks
vi.mock('../hooks/index', () => ({
  useAuthQuery: () => mockAuthQuery,
  useAuthState: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
  useLoginMutation: () => mockLoginMutation,
  useRegisterMutation: () => mockRegisterMutation,
  useLogoutMutation: () => mockLogoutMutation,
}));

// Helper to setup authenticated state
export const setupAuthenticatedState = (queryClient: QueryClient) => {
  mockAuthQuery.data = mockAuthResponse;
  mockAuthQuery.isSuccess = true;
  queryClient.setQueryData(['auth'], mockAuthResponse);
};

// Helper to setup unauthenticated state
export const setupUnauthenticatedState = (queryClient: QueryClient) => {
  mockAuthQuery.data = null;
  mockAuthQuery.isSuccess = true;
  queryClient.setQueryData(['auth'], null);
};

// Add ResizeObserver mock
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
