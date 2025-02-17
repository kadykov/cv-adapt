import { UseMutationResult } from '@tanstack/react-query';
import { AuthResponse, RegisterRequest } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

type RegisterMutationResult = UseMutationResult<
  AuthResponse,
  ApiError,
  RegisterRequest,
  unknown
>;

export const createMockMutation = (overrides?: Partial<RegisterMutationResult>): RegisterMutationResult => ({
  mutateAsync: jest.fn(),
  mutate: jest.fn(),
  data: null,
  error: null,
  failureCount: 0,
  failureReason: null,
  isError: false,
  isIdle: true,
  isLoading: false,
  isPending: false,
  isPaused: false,
  isSuccess: false,
  reset: jest.fn(),
  status: 'idle',
  variables: undefined,
  context: undefined,
  ...overrides,
});

export const createLoadingMutation = (): RegisterMutationResult => createMockMutation({
  status: 'pending',
  isLoading: true,
  isIdle: false,
  isPending: true,
});

export const createSuccessMutation = (data: AuthResponse): RegisterMutationResult => createMockMutation({
  status: 'success',
  data,
  isSuccess: true,
  isIdle: false,
});

export const createErrorMutation = (error: ApiError): RegisterMutationResult => createMockMutation({
  status: 'error',
  error,
  isError: true,
  isIdle: false,
  failureCount: 1,
  failureReason: error,
});
