import { useMutation } from '@tanstack/react-query';
import { authMutations } from '../services/auth-mutations';
import { useAuth } from './useAuth';
import type {
  AuthResponse,
  RegisterRequest,
} from '../../../lib/api/generated-types';

export function useRegisterMutation(
  onSuccess?: (response: AuthResponse) => void,
) {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authMutations.register(data);
      await login(response);
      return response;
    },
    onSuccess,
  });
}
