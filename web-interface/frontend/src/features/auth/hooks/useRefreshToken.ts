import { useMutation } from '@tanstack/react-query';
import { authMutations } from '../services/auth-mutations';
import type { AuthResponse } from '../../../lib/api/generated-types';

export function useRefreshToken(onSuccess?: (response: AuthResponse) => void) {
  return useMutation({
    mutationFn: (token: string) => authMutations.refresh(token),
    onSuccess,
  });
}
