import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../../../lib/api/generated-types';
import { authApi } from '../../../lib/api/auth';
import { tokenService } from './token-service';
import { ApiError } from '../../../lib/api/client';

export const authMutations = {
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const loginData: LoginRequest = {
      username: credentials.email,
      password: credentials.password,
      grant_type: 'password',
      scope: '',
    };
    try {
      const response = await authApi.login(loginData);
      if (!response.user) {
        throw new ApiError('Invalid response from server', 500);
      }
      tokenService.storeTokens(response);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('An unknown error occurred', 500);
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.register(data);
      if (!response.user) {
        throw new ApiError('Invalid response from server', 500);
      }
      tokenService.storeTokens(response);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('An unknown error occurred', 500);
    }
  },

  async refresh(token: string): Promise<AuthResponse> {
    try {
      const response = await authApi.refresh({ token });
      if (!response.user) {
        throw new ApiError('Invalid response from server', 500);
      }
      tokenService.storeTokens(response);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(error.message, 500);
      }
      throw new ApiError('An unknown error occurred', 500);
    }
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      tokenService.clearTokens();
    }
  },

  async validateToken(): Promise<AuthResponse | null> {
    try {
      const token = tokenService.getAccessToken();
      if (!token) {
        return null;
      }
      const profile = await authApi.getProfile();
      const storedRefreshToken = tokenService.getRefreshToken();
      if (!storedRefreshToken) {
        return null;
      }
      return {
        user: profile,
        access_token: token,
        refresh_token: storedRefreshToken,
        token_type: 'bearer',
      };
    } catch {
      return null;
    }
  },
};
