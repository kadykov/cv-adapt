import { useMutation } from '@tanstack/react-query';
import { authMutations } from '../services/auth-mutations';
import { useAuth } from './useAuth';
import type { AuthResponse } from '../../../lib/api/generated-types';

export function useLoginMutation(onSuccess?: (response: AuthResponse) => void) {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authMutations.login(credentials);
      // Dispatch auth state change event immediately after successful login response
      window.dispatchEvent(
        new CustomEvent('auth-state-change', {
          detail: { isAuthenticated: true, user: response.user },
        }),
      );
      // Then proceed with auth context update
      await login(response);
      return response;
    },
    onSuccess,
  });
}
