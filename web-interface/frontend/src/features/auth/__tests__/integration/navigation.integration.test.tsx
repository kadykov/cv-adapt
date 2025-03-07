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

describe('Navigation Integration', () => {
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
      createRouteConfig('', <div>Home</div>),
      createRouteConfig('auth', <Auth />),
    ]),
  ];

  beforeEach(() => {
    localStorage.clear();
    // Set initial route to home
    window.history.pushState({}, '', '/');
  });

  describe('Navigation Bar Auth State', () => {
    test('should show login form when navigating to auth route', async () => {
      const { user } = await setupFeatureTest({
        routes,
        initialPath: '/',
        authenticatedUser: false,
      });

      // Wait for loading state to finish
      await waitFor(() => {
        expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
      });

      // Click login button
      await user.click(screen.getByRole('link', { name: /login/i }));

      // Verify we're on the auth page
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('should show correct navigation items based on auth state', async () => {
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

      // Initial state - unauthenticated
      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /login/i }),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /jobs/i }),
      ).not.toBeInTheDocument();

      // Click login
      await user.click(screen.getByRole('link', { name: /login/i }));

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // After successful login
      await waitFor(() => {
        // Login button should be hidden
        expect(
          screen.queryByRole('link', { name: /login/i }),
        ).not.toBeInTheDocument();
        // Logout and Jobs buttons should appear
        expect(
          screen.getByRole('button', { name: /logout/i }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      });
    });

    test('should show login button after logout', async () => {
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

      // First login
      await user.click(screen.getByRole('link', { name: /login/i }));
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for auth state update
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /logout/i }),
        ).toBeInTheDocument();
      });

      // Click logout
      await user.click(screen.getByRole('button', { name: /logout/i }));

      // Verify navigation items reset
      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /login/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /logout/i }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('link', { name: /jobs/i }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
