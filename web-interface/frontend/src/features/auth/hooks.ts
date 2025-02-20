import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../lib/api/auth';
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
} from '../../lib/api/generated-types';
import { useAuth } from './auth-context';

export function useLoginMutation() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const data: LoginRequest = {
        username: credentials.email,
        password: credentials.password,
        scope: '',
        grant_type: 'password',
      };
      const response = await authApi.login(data);
      await login(response);
      return response;
    },
  });
}

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
