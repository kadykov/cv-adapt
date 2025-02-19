import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../lib/api/auth';
import type {
  AuthResponse,
  RegisterRequest,
} from '../../lib/api/generated-types';
import { useAuth } from './auth-context';

export function useRegisterMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authApi.register(data);
      await login(response);
      return response;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    retry: false,
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await authApi.refresh({ token });
      return response as AuthResponse;
    },
  });
}
