import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authMutations } from '../services/auth-mutations';
import { AUTH_QUERY_KEY } from './useAuthQuery';
import { tokenService } from '../services/token-service';
import { ApiError } from '../../../lib/api/client';

export function useLogoutMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError>({
    mutationFn: async () => {
      // Clear local state before API call
      tokenService.clearTokens();
      // Update auth state immediately
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      // Invalidate all queries to ensure fresh state
      queryClient.invalidateQueries();
      // Remove all queries from cache to prevent stale data
      queryClient.removeQueries();

      // Now attempt the API call, but don't wait for it
      try {
        await authMutations.logout();
      } catch {
        // Ignore logout errors - state is already cleared
        // This matches our previous behavior where we prioritize
        // local state cleanup over API success
      }
    },
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      // Even if the API call fails, we keep the UI in logged out state
      // since we've already cleared tokens and cache
      tokenService.clearTokens();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.removeQueries();
    },
  });
}
