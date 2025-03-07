import { describe, expect, test, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
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

describe('Auth Navigation Integration', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null,
  };

  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('', <div>Home Page</div>),
      createRouteConfig('auth', <Auth />),
    ]),
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  test('should maintain auth state after navigation and remounting', async () => {
    const mockTokens = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      user: mockUser,
    };

    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/auth',
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

    // Fill in login form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for successful login
    await waitFor(() => {
      expect(tokenService.getAccessToken()).toBeTruthy();
    });

    // Verify auth state is preserved
    await waitFor(() => {
      // Logout button should be present
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
      // Jobs link should be present
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      // Login button should not be present
      expect(
        screen.queryByRole('link', { name: /login/i }),
      ).not.toBeInTheDocument();
    });
  });

  test('should clear auth state after logout', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: true,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', mockUser),
        createEmptyResponseHandler('post', 'auth/logout', { status: 204 }),
      ],
    });

    // Wait for auth state to be loaded
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });

    // Click logout
    await user.click(screen.getByRole('button', { name: /logout/i }));

    // Verify auth state is cleared
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /jobs/i }),
      ).not.toBeInTheDocument();
      expect(tokenService.getAccessToken()).toBeNull();
    });
  });

  test('should handle initial load with valid tokens', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: true,
      handlers: [createGetHandler('auth/me', 'UserResponse', mockUser)],
    });

    // Verify auth state is loaded from tokens
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /login/i }),
      ).not.toBeInTheDocument();
    });
  });

  test('should handle invalid tokens on initial load', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: false,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', null, {
          status: 401,
        }),
      ],
    });

    // Store invalid tokens
    localStorage.setItem('access_token', 'invalid_token');
    localStorage.setItem('refresh_token', 'invalid_refresh');

    // Verify auth state is cleared and user is logged out
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /jobs/i }),
      ).not.toBeInTheDocument();
    });
  });
});
