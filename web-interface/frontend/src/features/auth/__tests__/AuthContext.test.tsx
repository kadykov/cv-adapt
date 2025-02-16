import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { server } from '@/mocks/server';
import { handlers } from '@/mocks/handlers/generate-handlers';

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
  const [error, setError] = React.useState<string | null>(null);

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password', true);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to login');
      }
    }
  };

  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      {error && <div role="alert" data-testid="error-message">{error}</div>}
      {isAuthenticated && user ? (
        <>
          <span data-testid="user-email">{user.email}</span>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <button
          onClick={handleLogin}
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
    // Clear cookie store
    Object.keys(cookieStore).forEach(key => {
      delete cookieStore[key];
    });
    vi.clearAllMocks();
  });

  test('authentication flow', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
    });

    // Login
    await user.click(screen.getByTestId('login-button'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toBeInTheDocument();
    });
    expect(cookieStore['auth_token']).toBeDefined();
    expect(cookieStore['refresh_token']).toBeDefined();

    // Logout
    await user.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
    expect(cookieStore).not.toHaveProperty('auth_token');
    expect(cookieStore).not.toHaveProperty('refresh_token');
  });

  test('handles errors during login', async () => {
    // Override with error response
    server.use(handlers.login_v1_auth_login_post.error.HTTPValidationError());

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
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
    });
    expect(cookieStore).not.toHaveProperty('auth_token');
  });

  test('persists and loads state from cookies', async () => {
    // Set up initial cookie state
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      created_at: new Date().toISOString(),
      personal_info: null
    };

    cookieStore['auth_token'] = 'mock_token';
    cookieStore['auth_user'] = JSON.stringify(mockUser);
    cookieStore['refresh_token'] = 'mock_refresh_token';

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    });
  });
});
