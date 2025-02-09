import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, logout, refreshToken } from '../auth.api';
import type { LoginCredentials, RegistrationData } from '../../types';

// Mock successful auth response
const mockAuthResponse = {
  access_token: 'mock_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    personal_info: {},
    created_at: new Date().toISOString()
  }
};

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      remember: true
    };

    it('formats login request according to OAuth2 password flow requirements', async () => {
      const mockResponse = new Response(
        JSON.stringify(mockAuthResponse),
        {
          status: 200,
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await login(credentials);

      const expectedFormData = new URLSearchParams();
      expectedFormData.append('username', credentials.email);
      expectedFormData.append('password', credentials.password);
      expectedFormData.append('grant_type', 'password');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: expectedFormData
      });
    });

    it('handles successful login response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      });

      const response = await login(credentials);
      expect(response).toEqual(mockAuthResponse);
    });

    it('handles login error response', async () => {
      const errorResponse = new Response(
        JSON.stringify({
          detail: { message: 'Invalid credentials' }
        }),
        {
          status: 401,
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

      await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const registrationData: RegistrationData = {
      email: 'test@example.com',
      password: 'Password123',
      acceptTerms: true
    };

    it('handles successful registration', async () => {
      const mockResponse = new Response(
        JSON.stringify(mockAuthResponse),
        {
          status: 200,
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await register(registrationData);
      expect(response).toEqual(mockAuthResponse);
    });

    it('handles registration error', async () => {
      const errorResponse = new Response(
        JSON.stringify({
          detail: { message: 'Email already exists' }
        }),
        {
          status: 401,
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

      await expect(register(registrationData)).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('sends logout request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      await logout();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    it('handles logout error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('refreshToken', () => {
    it('handles successful token refresh', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse)
      });

      const response = await refreshToken('old_token');
      expect(response).toEqual(mockAuthResponse);
    });

    it('handles refresh error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: { message: 'Invalid token' } })
      });

      await expect(refreshToken('invalid_token')).rejects.toThrow('Invalid token');
    });
  });
});
