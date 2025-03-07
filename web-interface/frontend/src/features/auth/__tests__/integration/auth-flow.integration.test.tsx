import { describe, test, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import {
  createGetHandler,
  createFormPostHandler,
} from '../../../../lib/test/integration/handler-generator';
import type { User } from '../../../../lib/api/generated-types';
import { ROUTES } from '../../../../routes/paths';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-17T12:00:00Z',
  personal_info: null,
};

describe('Auth Flow Integration', () => {
  const HomePage = () => (
    <div>
      <h1 data-testid="home-page">Home Page</h1>
    </div>
  );

  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('', <HomePage />),
      createRouteConfig('auth', <Auth />),
    ]),
  ];

  test('should handle successful login flow', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/auth',
      authenticatedUser: false,
      handlers: [
        createFormPostHandler(
          'auth/login',
          'Body_login_v1_api_auth_login_post',
          'AuthResponse',
          {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            token_type: 'bearer',
            user: mockUser,
          },
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

    // Verify we start on login page
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Click submit button and wait for form submission
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Wait for navigation and auth state updates
    await waitFor(() => {
      expect(window.location.pathname).toBe(ROUTES.HOME);
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });
  });

  test('should handle invalid credentials', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/auth',
      authenticatedUser: false,
      handlers: [
        createFormPostHandler(
          'auth/login',
          'Body_login_v1_api_auth_login_post',
          'HTTPValidationError',
          {
            detail: [
              {
                loc: ['body'],
                msg: 'Invalid credentials',
                type: 'value_error.invalid_credentials',
              },
            ],
          },
          {
            validateRequest: () => false,
            errorResponse: {
              status: 401,
              message: 'Invalid credentials',
            },
          },
        ),
      ],
    });

    // Fill in form with wrong password
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Click submit button
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/invalid credentials/i);
    });

    // Should stay on sign in page
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test('should preserve auth state after login', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/auth',
      authenticatedUser: false,
      handlers: [
        createFormPostHandler(
          'auth/login',
          'Body_login_v1_api_auth_login_post',
          'AuthResponse',
          {
            access_token: 'valid-token',
            refresh_token: 'refresh-token',
            token_type: 'bearer',
            user: mockUser,
          },
        ),
        createGetHandler('auth/me', 'UserResponse', mockUser),
      ],
    });

    // Login
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    // Wait for successful navigation and state updates
    await waitFor(() => {
      expect(window.location.pathname).toBe(ROUTES.HOME);
    });

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /detailed cvs/i }),
      ).toBeInTheDocument();
    });
  });

  test('should allow switching between login and register forms', async () => {
    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/auth',
      authenticatedUser: false,
    });

    // Verify initial state shows login form
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();

    // Switch to register form
    await user.click(screen.getByRole('button', { name: /need an account/i }));

    // Verify register form is shown
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i }),
      ).toBeInTheDocument();
    });

    // Switch back to login
    await user.click(
      screen.getByRole('button', { name: /already have an account/i }),
    );

    // Verify back on login form
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });
});
