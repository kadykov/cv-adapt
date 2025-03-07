import { describe, expect, test, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { LoginForm } from '../../components/LoginForm';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import {
  createGetHandler,
  createEmptyResponseHandler,
  createFormPostHandler,
} from '../../../../lib/test/integration/handler-generator';
import { tokenService } from '../../services/token-service';

describe('Header Update Timing', () => {
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

  beforeEach(() => {
    localStorage.clear();
    // Reset route history for each test
    window.history.pushState({}, '', '/');
  });

  test('should update header and redirect after login success', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('', <div>Home Page</div>),
        createRouteConfig('auth', <LoginForm onSuccess={() => {}} />),
      ]),
    ];

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
        // Add a delay to the /users/me endpoint to simulate a slow validation
        createGetHandler('auth/me', 'UserResponse', mockUser, {
          delay: 2000, // 2-second delay
        }),
      ],
    });

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Navigate to auth page
    await user.click(screen.getByRole('link', { name: /login/i }));

    // Fill in form and submit
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verify header updates immediately after login API success, before validation completes
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /logout/i }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
        expect(
          screen.queryByRole('link', { name: /login/i }),
        ).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    ); // Header should update within 1 second

    // Verify we are redirected to home page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    // Wait for validation to complete and verify the header still shows authenticated state
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for the 2s delay plus buffer
    const nav = screen.getByRole('navigation');
    expect(
      within(nav).getByRole('button', { name: /logout/i }),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole('link', { name: /jobs/i }),
    ).toBeInTheDocument();
    expect(
      within(nav).queryByRole('link', { name: /login/i }),
    ).not.toBeInTheDocument();
  });

  test('should update auth state when logout is triggered and completed', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('', <div>Home Page</div>),
        createRouteConfig('auth', <div>Auth Page</div>),
      ]),
    ];

    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: true,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', mockUser),
        createEmptyResponseHandler('post', 'auth/logout', { status: 204 }),
      ],
    });

    // Wait for initial auth state to settle
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });

    // Navigate to auth page before logout
    window.history.pushState({}, '', '/auth');

    // Click logout
    await user.click(screen.getByRole('button', { name: /logout/i }));

    // Verify header updates and state is cleared
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /logout/i }),
      ).not.toBeInTheDocument();
    });

    // Verify we stay on auth page
    expect(window.location.pathname).toBe('/auth');
  });

  test('should maintain logged out state even if logout API call fails', async () => {
    const routes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('', <div>Home Page</div>),
        createRouteConfig('auth', <div>Auth Page</div>),
      ]),
    ];

    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: true,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', mockUser),
        // Add a delay and error status to the logout endpoint
        createEmptyResponseHandler('post', 'auth/logout', {
          status: 500,
          delay: 1000, // 1-second delay
        }),
      ],
    });

    // Wait for initial auth state to settle
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });

    // Navigate to auth page before logout
    window.history.pushState({}, '', '/auth');

    // Click logout
    await user.click(screen.getByRole('button', { name: /logout/i }));

    // Give the UI a chance to update after the logout action
    await waitFor(
      () => {
        const nav = screen.getByRole('navigation');
        expect(
          within(nav).getByRole('link', { name: /login/i }),
        ).toBeInTheDocument();
        expect(
          within(nav).queryByRole('button', { name: /logout/i }),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 }, // Increased timeout to account for API delay
    );

    // Verify we stay on auth page
    expect(window.location.pathname).toBe('/auth');

    // Wait for the failed API call to complete and verify UI state persists
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait longer than the API delay
    const nav = screen.getByRole('navigation');
    expect(
      within(nav).getByRole('link', { name: /login/i }),
    ).toBeInTheDocument();
    expect(
      within(nav).queryByRole('button', { name: /logout/i }),
    ).not.toBeInTheDocument();

    // Verify tokens are cleared even though API call failed
    expect(tokenService.getAccessToken()).toBeNull();
  });
});
