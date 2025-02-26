import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AuthResponse,
  RegisterRequest,
} from '../../../lib/api/generated-types';
import { authMutations } from '../services/auth-mutations';
import { tokenService } from '../services/token-service';
import { AUTH_QUERY_KEY } from './useAuthQuery';
import { ApiError } from '../../../lib/api/client';

/**
 * Hook for handling user registration with React Query.
 * Manages token storage and auth state updates on successful registration.
 */
export function useRegisterMutation(
  onSuccess?: (response: AuthResponse) => void,
) {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, ApiError, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await authMutations.register(data);
      // Store tokens immediately after successful registration
      tokenService.storeTokens(response);
      return response;
    },
    onSuccess: (data) => {
      // Immediately update auth state in React Query cache
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
      // Invalidate all queries to ensure fresh data
      queryClient.invalidateQueries();
      // Call provided success callback if any
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: () => {
      // Clear any existing tokens on registration error
      tokenService.clearTokens();
      // Clear auth state in cache
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    },
  });
}
