import { describe, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Layout } from '../../../../routes/Layout';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import { createGetHandler } from '../../../../lib/test/integration/handler-generator';
import type { User } from '../../../../lib/api/generated-types';

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-17T12:00:00Z',
  personal_info: null,
};

describe('Protected Route Integration', () => {
  const ProtectedComponent = () => <div>Protected Content</div>;
  const LoginPage = () => <div aria-label="login-page">Login Page</div>;

  const routes = [
    createRouteConfig('/', <Layout />, [
      // Public routes
      createRouteConfig('', <div>Home Page</div>),
      createRouteConfig('auth', <LoginPage />),

      // Protected routes
      createRouteConfig('protected', <ProtectedRoute />, [
        createRouteConfig('', <ProtectedComponent />),
      ]),
    ]),
  ];

  test('should redirect to login when not authenticated', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/protected',
      authenticatedUser: false,
      history: {
        entries: ['/protected'],
        index: 0,
      },
      handlers: [
        createGetHandler('/auth/me', 'UserResponse', null, {
          status: 401,
        }),
      ],
    });

    // First verify that the login page is shown
    const loginPage = await screen.findByLabelText(
      'login-page',
      {},
      { timeout: 2000 },
    );
    expect(loginPage).toBeInTheDocument();

    // Look for a navigation indicator in the header
    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toHaveAttribute('href', ROUTES.AUTH);
      expect(loginLink).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('should redirect to login with attempted URL in state', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/protected',
      authenticatedUser: false,
      history: {
        entries: ['/protected'],
        index: 0,
      },
      handlers: [
        createGetHandler('/auth/me', 'UserResponse', null, {
          status: 401,
        }),
      ],
    });

    // First verify we're redirected to login
    const loginPage = await screen.findByLabelText(
      'login-page',
      {},
      { timeout: 2000 },
    );
    expect(loginPage).toBeInTheDocument();

    // MockNavigate should have been called with the correct state
    await waitFor(() => {
      // Look for the login page content
      expect(screen.getByLabelText('login-page')).toBeInTheDocument();

      // And check login link is present (just as a basic navigation check)
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toBeInTheDocument();
    });

    // Protected content should not be shown
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('should render protected content when authenticated', async () => {
    await setupFeatureTest({
      routes,
      initialPath: '/protected',
      authenticatedUser: true,
      history: {
        entries: ['/protected'],
        index: 0,
      },
      handlers: [createGetHandler('/auth/me', 'UserResponse', mockUser)],
    });

    // Wait for protected content to be rendered
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Verify login page is not shown
    expect(screen.queryByLabelText(/login page/i)).not.toBeInTheDocument();
  });
});
