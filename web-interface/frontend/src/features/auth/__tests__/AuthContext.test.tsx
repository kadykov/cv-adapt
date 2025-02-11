import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockAuthResponse } from '@/mocks/auth-mock-data';

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

// Test component that uses auth context
function TestComponent() {
  const { login, logout, isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      {isAuthenticated && user ? (
        <>
          <span data-testid="user-email">{user.email}</span>
          <button onClick={() => logout()}>Logout</button>
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
    // Clear cookie store and mocks
    Object.keys(cookieStore).forEach(key => {
      delete cookieStore[key];
    });
    vi.clearAllMocks();
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
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Check cookie values after waiting for async operations
    expect(cookieStore['auth_token']).toBe(mockAuthResponse.access_token);
    expect(cookieStore['auth_user']).toBe(JSON.stringify(mockAuthResponse.user));
    expect(cookieStore['refresh_token']).toBe(mockAuthResponse.refresh_token);
  });

  test('handles login failure', async () => {
    const user = userEvent.setup();

    // Override the default success handler with an error for this test
    server.use(
      http.post('*/v1/auth/login', () => {
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    expect(cookieStore).not.toHaveProperty('auth_token');
    expect(cookieStore).not.toHaveProperty('auth_user');
    expect(cookieStore).not.toHaveProperty('refresh_token');
  });

  test('handles logout', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // First login
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Then logout
    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });

    expect(cookieStore).not.toHaveProperty('auth_token');
    expect(cookieStore).not.toHaveProperty('auth_user');
    expect(cookieStore).not.toHaveProperty('refresh_token');
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
