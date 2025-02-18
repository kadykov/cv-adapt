import type { UseMutationResult } from '@tanstack/react-query';
import type { AuthResponse } from '../api/auth';
import type { ApiError } from '../api/client';

export type MockAuthMutation = Pick<
  UseMutationResult<AuthResponse, ApiError, unknown, unknown>,
  'mutate' | 'mutateAsync' | 'isError' | 'error' | 'isPending' | 'isSuccess' | 'status' | 'data'
>;

/**
 * Creates a mock auth mutation result for testing.
 */
export function createMockAuthMutation(
  overrides: Partial<MockAuthMutation> = {}
): MockAuthMutation {
  return {
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isError: false,
    error: null,
    isPending: false,
    isSuccess: false,
    status: 'idle',
    data: undefined,
    ...overrides,
  };
}

/**
 * Auth mutation states for testing
 */
export function createPendingAuthMutation(): MockAuthMutation {
  return createMockAuthMutation({
    isPending: true,
    isSuccess: false,
    status: 'pending'
  });
}

export function createSuccessAuthMutation(data: AuthResponse): MockAuthMutation {
  return createMockAuthMutation({
    isError: false,
    error: null,
    isPending: false,
    isSuccess: true,
    status: 'success',
    data,
    mutateAsync: jest.fn().mockResolvedValue(data)
  });
}

export function createErrorAuthMutation(error: ApiError): MockAuthMutation {
  return createMockAuthMutation({
    isError: true,
    error,
    isPending: false,
    isSuccess: false,
    status: 'error',
    data: undefined,
    mutateAsync: jest.fn().mockRejectedValue(error)
  });
}
