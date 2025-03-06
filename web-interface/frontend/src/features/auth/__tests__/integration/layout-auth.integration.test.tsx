import { describe, expect, test, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { LoginForm } from '../../components/LoginForm';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import {
  createFormPostHandler,
  createGetHandler,
  createEmptyResponseHandler,
} from '../../../../lib/test/integration/handler-generator';
import { tokenService } from '../../services/token-service';

describe('Layout Authentication Integration', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    created_at: '2024-02-23T10:00:00Z',
    personal_info: null,
  };

  const mockTokens = {
    access_token: 'valid-token',
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    user: mockUser,
  };

  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('', <div>Home Page</div>),
      createRouteConfig('auth', <LoginForm onSuccess={() => {}} />),
    ]),
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  test('should show login button when not authenticated', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: false,
    });

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /jobs/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
    });
  });

  test('should update navigation after successful login', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: false,
      handlers: [
        createFormPostHandler(
          'auth/login',
          'Body_login_v1_api_auth_login_post',
          'AuthResponse',
          mockTokens,
          {
            validateRequest: (formData) => {
              const username = formData.get('username');
              const password = formData.get('password');
              return (
                username === 'test@example.com' && password === 'password123'
              );
            },
          },
        ),
        createGetHandler('auth/me', 'UserResponse', mockUser),
      ],
    });

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Initial state - only Login button visible
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('link', { name: /jobs/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /logout/i }),
    ).not.toBeInTheDocument();

    // Navigate to auth page
    await user.click(screen.getByRole('link', { name: /login/i }));

    // Fill in and submit login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify navigation updates immediately after login
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /login/i }),
      ).not.toBeInTheDocument();
    });

    // Verify token is stored
    expect(tokenService.getAccessToken()).toBeTruthy();

    // Wait for background token validation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensure header content hasn't changed
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /login/i }),
    ).not.toBeInTheDocument();
  });

  test('should update navigation after logout', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: false,
      handlers: [
        createFormPostHandler(
          'auth/login',
          'Body_login_v1_api_auth_login_post',
          'AuthResponse',
          mockTokens,
          {
            validateRequest: (formData) => {
              const username = formData.get('username');
              const password = formData.get('password');
              return (
                username === 'test@example.com' && password === 'password123'
              );
            },
          },
        ),
        createGetHandler('auth/me', 'UserResponse', mockUser),
        createEmptyResponseHandler('post', 'auth/logout', { status: 204 }),
      ],
    });

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Navigate to auth page
    await user.click(screen.getByRole('link', { name: /login/i }));

    // Fill in and submit login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for authenticated state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });

    // Click logout button
    await user.click(screen.getByRole('button', { name: /logout/i }));

    // Verify navigation updates
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /jobs/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
    });

    // Verify token is removed
    expect(tokenService.getAccessToken()).toBeNull();
  });
});
