import { vi } from 'vitest';
import type { UseMutationResult, UseMutateFunction, UseMutateAsyncFunction } from '@tanstack/react-query';
import type { AuthResponse } from '../types';
import { ApiError } from '../../../lib/api/client';

export type RegisterVariables = {
  email: string;
  password: string;
};

// Create exact mutation function types from React Query
type MutateFunction = UseMutateFunction<AuthResponse, ApiError, RegisterVariables, unknown>;
type MutateAsyncFunction = UseMutateAsyncFunction<AuthResponse, ApiError, RegisterVariables, unknown>;

// Create base mutation type that matches React Query's structure exactly
type BaseMutationResult = {
  data?: AuthResponse;
  error: ApiError | null;
  failureCount: number;
  failureReason: ApiError | null;
  isPaused: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  variables?: RegisterVariables;
  context?: unknown;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  submittedAt?: number;
  mutate: MutateFunction;
  mutateAsync: MutateAsyncFunction;
  reset: () => void;
};

const mockMutate = vi.fn() as unknown as MutateFunction;
const mockMutateAsync = vi.fn() as unknown as MutateAsyncFunction;

const baseMutation: BaseMutationResult = {
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  status: 'idle',
  variables: undefined,
  context: undefined,
  isError: false,
  isIdle: true,
  isPending: false,
  isSuccess: false,
  submittedAt: Date.now(),
  mutate: mockMutate,
  mutateAsync: mockMutateAsync,
  reset: vi.fn(),
};

export const createMockMutation = (
  overrides: Partial<BaseMutationResult> = {}
): UseMutationResult<AuthResponse, ApiError, RegisterVariables, unknown> => ({
  ...baseMutation,
  ...overrides,
} as UseMutationResult<AuthResponse, ApiError, RegisterVariables, unknown>);

export const createPendingMutation = () => createMockMutation({
  status: 'loading',
  isPending: true,
  isIdle: false,
  data: undefined,
  submittedAt: Date.now(),
});

export const createSuccessMutation = (data: AuthResponse) => {
  const mutateAsync = vi.fn().mockResolvedValue(data) as unknown as MutateAsyncFunction;
  return createMockMutation({
    status: 'success',
    data,
    isSuccess: true,
    isIdle: false,
    mutateAsync,
    submittedAt: Date.now(),
  });
};

export const createErrorMutation = (error: ApiError) => {
  const mutateAsync = vi.fn().mockRejectedValue(error) as unknown as MutateAsyncFunction;
  return createMockMutation({
    status: 'error',
    error,
    isError: true,
    isIdle: false,
    failureCount: 1,
    failureReason: error,
    mutateAsync,
    submittedAt: Date.now(),
  });
};
