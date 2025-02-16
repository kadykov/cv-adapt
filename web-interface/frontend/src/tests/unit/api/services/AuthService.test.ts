import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/api/services/AuthService';
import { ApiError } from '@/api/core/ApiError';
import { createTestHelpers } from '@/tests/setup';
import type { AuthResponse } from '@/types/api';

const mockAuthResponse: AuthResponse = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
};

describe('AuthService', () => {
  const { simulateSuccess, simulateError } = createTestHelpers();
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    authService = new AuthService();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      simulateSuccess('/api/v1/auth/login', 'post', mockAuthResponse);

      const email = 'test@example.com';
      const password = 'password123';

      const response = await authService.login(email, password);

      expect(response).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'bearer',
        user: {
          id: expect.any(Number),
          email: expect.any(String),
          created_at: expect.any(String)
        }
      });

      expect(localStorage.getItem('access_token')).toBeTruthy();
      expect(localStorage.getItem('refresh_token')).toBeTruthy();
    });

    it('should handle login failure with invalid credentials', async () => {
      simulateError(
        '/api/v1/auth/login',
        'post',
        401,
        'Invalid credentials'
      );

      const email = 'wrong@example.com';
      const password = 'wrongpass';

      const loginPromise = authService.login(email, password);

      await expect(loginPromise).rejects.toThrow(ApiError);

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should handle server errors during login', async () => {
      simulateError(
        '/api/v1/auth/login',
        'post',
        500,
        'Internal server error'
      );

      const loginPromise = authService.login('test@example.com', 'password');

      await expect(loginPromise).rejects.toThrow(ApiError);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear tokens on successful logout', async () => {
      simulateSuccess('/api/v1/auth/logout', 'post', { message: 'Logged out successfully' });

      localStorage.setItem('access_token', 'mock_access_token');
      localStorage.setItem('refresh_token', 'mock_refresh_token');

      await authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should clear tokens even if server request fails', async () => {
      simulateError(
        '/api/v1/auth/logout',
        'post',
        500,
        'Server error'
      );

      localStorage.setItem('access_token', 'mock_access_token');
      localStorage.setItem('refresh_token', 'mock_refresh_token');

      await authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const newAuthResponse: AuthResponse = {
        ...mockAuthResponse,
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token'
      };

      simulateSuccess('/api/v1/auth/refresh', 'post', newAuthResponse);

      localStorage.setItem('refresh_token', 'mock_refresh_token');

      const response = await authService.refreshToken();

      expect(response).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'bearer'
      });

      expect(localStorage.getItem('access_token')).toBe('new_access_token');
      expect(localStorage.getItem('refresh_token')).toBe('new_refresh_token');
    });

    it('should handle refresh token failure and clear tokens', async () => {
      simulateError(
        '/api/v1/auth/refresh',
        'post',
        401,
        'Invalid refresh token'
      );

      localStorage.setItem('refresh_token', 'invalid_token');

      const refreshPromise = authService.refreshToken();

      await expect(refreshPromise).rejects.toThrow(ApiError);

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('should throw error when no refresh token is available', async () => {
      const refreshPromise = authService.refreshToken();

      await expect(refreshPromise).rejects.toThrow('No refresh token available');
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('access_token', 'mock_access_token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when access token is missing', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when access token is empty string', () => {
      localStorage.setItem('access_token', '');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when it exists', () => {
      localStorage.setItem('access_token', 'mock_access_token');
      expect(authService.getAccessToken()).toBe('mock_access_token');
    });

    it('should return null when no access token exists', () => {
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});
