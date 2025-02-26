import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthResponse } from '../../../lib/api/generated-types';
import { authMutations } from '../services/auth-mutations';
import { AUTH_QUERY_KEY } from './useAuthQuery';
import { tokenService } from '../services/token-service';
import { ApiError } from '../../../lib/api/client';

export function useLoginMutation(onSuccess?: (response: AuthResponse) => void) {
  const queryClient = useQueryClient();

  return useMutation<
    AuthResponse,
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: async (credentials) => {
      const response = await authMutations.login(credentials);
      // Store tokens immediately after successful login
      tokenService.storeTokens(response);
      return response;
    },
    onSuccess: (data) => {
      // Immediately update auth state in React Query cache
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
      // Invalidate all queries to ensure fresh data after login
      queryClient.invalidateQueries();
      // Call provided success callback if any
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      // Clear tokens on login error
      tokenService.clearTokens();
      // Clear auth state in cache
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      throw error;
    },
  });
}
