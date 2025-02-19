import type { MutationObserverResult } from '@tanstack/react-query';
import type { UseMutateFunction, UseMutateAsyncFunction } from '@tanstack/react-query';

export type MockMutationResult<TData, TError, TVariables> = Omit<
  MutationObserverResult<TData, TError, TVariables | undefined, unknown>,
  'mutate' | 'mutateAsync'
> & {
  mutate: UseMutateFunction<TData, TError, TVariables, unknown>;
  mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, unknown>;
};

const baseMutation = <TData, TError, TVariables>(): MockMutationResult<TData, TError, TVariables> => ({
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isError: false,
  isIdle: true,
  isPending: false,
  isPaused: false,
  isSuccess: false,
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  status: 'idle',
  variables: undefined,
  context: undefined,
  submittedAt: 0,
});

export const createIdleMutation = <TData, TError, TVariables>(): MockMutationResult<TData, TError, TVariables> => ({
  ...baseMutation<TData, TError, TVariables>(),
});

export const createLoadingMutation = <TData, TError, TVariables>(): MockMutationResult<TData, TError, TVariables> => ({
  ...baseMutation<TData, TError, TVariables>(),
  status: 'pending',
  isIdle: false,
  isPending: true,
  submittedAt: Date.now(),
});

export const createSuccessMutation = <TData, TError, TVariables>(data: TData): MockMutationResult<TData, TError, TVariables> => ({
  ...baseMutation<TData, TError, TVariables>(),
  data,
  status: 'success',
  isSuccess: true,
  isIdle: false,
  submittedAt: Date.now(),
});

export const createErrorMutation = <TData, TError, TVariables>(error: TError): MockMutationResult<TData, TError, TVariables> => ({
  ...baseMutation<TData, TError, TVariables>(),
  error,
  status: 'error',
  isError: true,
  isIdle: false,
  failureCount: 1,
  failureReason: error,
  submittedAt: Date.now(),
});
