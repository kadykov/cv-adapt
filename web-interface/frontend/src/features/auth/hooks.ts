import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../lib/api/auth';
import type { RegisterRequest } from '../../lib/api/generated-types';
import { useAuth } from './auth-context';
import { authMutations } from './services/auth-mutations';

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authMutations.login(credentials);
      await login(response);
      return response;
    },
  });
}

export function useRegisterMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await authMutations.register(data);
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
      const response = await authMutations.refresh(token);
      return response;
    },
  });
}
