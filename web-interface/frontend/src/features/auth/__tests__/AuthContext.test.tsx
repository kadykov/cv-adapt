/// <reference types="vitest/globals" />
import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ApiError } from '../../../api/core/api-error';
import type { AuthResponse } from '../types';
import { authService } from '../../../api/services/auth.service';

// Mock js-cookie module
const cookieStore: Record<string, string> = {};

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn((name: string) => cookieStore[name]),
    set: vi.fn((name: string, value: string) => {
      cookieStore[name] = value;
    }),
    remove: vi.fn((name: string) => {
      delete cookieStore[name];
    }),
  },
}));

vi.mock('../../../api/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  email: 'test@example.com',
  personal_info: null,
  created_at: new Date().toISOString(),
};

const mockAuthResponse: AuthResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser,
};

// Test component that uses auth context
function TestComponent() {
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      {isAuthenticated ? (
        <>
          <span data-testid="user-email">{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button
          onClick={() => login('test@example.com', 'password', true)}
          data-testid="login-button"
        >
          Login
        </button>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookie store
    Object.keys(cookieStore).forEach(key => {
      delete cookieStore[key];
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('provides authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  test('handles login success', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-button'));
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Check cookie values after waiting for async operations
    expect(cookieStore['auth_token']).toBe(mockAuthResponse.access_token);
    expect(cookieStore['auth_user']).toBe(JSON.stringify(mockAuthResponse.user));
    expect(cookieStore['refresh_token']).toBe(mockAuthResponse.refresh_token);
  });

  test('handles login failure', async () => {
    const error = new ApiError('Invalid credentials', 401);
    vi.mocked(authService.login).mockRejectedValue(error);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      try {
        await userEvent.click(loginButton);
      } catch (err) {
        expect(err).toEqual(error);
      }
    });

    expect(authService.login).toHaveBeenCalled();
    expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(cookieStore).not.toHaveProperty('auth_token');
    expect(cookieStore).not.toHaveProperty('auth_user');
    expect(cookieStore).not.toHaveProperty('refresh_token');
  });

  test('handles logout', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // First login
    await act(async () => {
      await userEvent.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Then logout
    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
      expect(cookieStore).not.toHaveProperty('auth_token');
      expect(cookieStore).not.toHaveProperty('auth_user');
      expect(cookieStore).not.toHaveProperty('refresh_token');
    });
  });

  test('loads initial state from cookies', async () => {
    // Set up cookie values before rendering
    cookieStore['auth_token'] = mockAuthResponse.access_token;
    cookieStore['auth_user'] = JSON.stringify(mockAuthResponse.user);
    cookieStore['refresh_token'] = mockAuthResponse.refresh_token;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });
});
