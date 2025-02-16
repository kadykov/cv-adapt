import { ApiError } from '../core/api-error';
import { API_CONFIG } from '../core/config';
import type { AuthResponse, LoginCredentials, RegistrationData } from '@/features/auth/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.endpoints.auth.login), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.detail?.message || 'Login failed', errorData.detail);
    }

    return response.json();
  },

  async register(data: RegistrationData): Promise<AuthResponse> {
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.endpoints.auth.register), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.detail?.message || 'Registration failed', errorData.detail);
    }

    return response.json();
  },

  async refreshToken(token: string): Promise<AuthResponse> {
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.endpoints.auth.refresh), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to refresh token');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(API_CONFIG.getUrl(API_CONFIG.endpoints.auth.logout), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new ApiError('Logout failed');
    }
  },
};
