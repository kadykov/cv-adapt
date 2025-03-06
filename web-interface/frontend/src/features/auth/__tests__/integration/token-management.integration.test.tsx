import { describe, test, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
import {
  createRouteConfig,
  setupFeatureTest,
} from '../../../../lib/test/integration/setup-navigation';
import {
  createFormPostHandler,
  createGetHandler,
  createPostHandler,
  createEmptyResponseHandler,
} from '../../../../lib/test/integration/handler-generator';
import type { User } from '../../../../lib/api/generated-types';
import { ROUTES } from '../../../../routes/paths';
import { tokenService } from '../../services/token-service';
import { setupInterceptors } from '../../../../lib/api/axios-interceptors';
import { authMutations } from '../../services/auth-mutations';

// Set up axios interceptors for token refresh
setupInterceptors();

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-17T12:00:00Z',
  personal_info: null,
};

describe('Token Management Integration', () => {
  const HomePage = () => {
    const triggerRefresh = async () => {
      try {
        const refreshToken = tokenService.getRefreshToken();
        if (refreshToken) {
          await authMutations.refresh(refreshToken);
        }
      } catch (error) {
        console.error('API request failed:', error);
      }
    };

    return (
      <div>
        <h1>Home Page</h1>
        <span data-testid="user-email">{mockUser.email}</span>
        <button data-testid="trigger-api" onClick={triggerRefresh}>
          Refresh Token
        </button>
      </div>
    );
  };

  const routes = [
    createRouteConfig('/', <Layout />, [
      createRouteConfig('', <HomePage />),
      createRouteConfig('auth', <Auth />),
    ]),
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  test('should handle initial token storage and expiration', async () => {
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

    // Login flow
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify successful navigation
    await waitFor(() => {
      expect(window.location.pathname).toBe(ROUTES.HOME);
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        mockUser.email,
      );
    });

    // Verify token storage
    const storedTokens = tokenService.getStoredTokens();
    expect(storedTokens).toBeTruthy();
    expect(storedTokens?.access_token).toBe(mockTokens.access_token);
    expect(storedTokens?.refresh_token).toBe(mockTokens.refresh_token);
    expect(storedTokens?.expires_at).toBeDefined();
  });

  test('should handle manual token refresh', async () => {
    // Setup with initial tokens
    const initialTokens = {
      access_token: 'expired-token',
      refresh_token: 'initial-refresh-token',
      token_type: 'bearer',
      user: mockUser,
    };

    const refreshedTokens = {
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      token_type: 'bearer',
      user: mockUser,
    };

    let refreshCallMade = false;

    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: false,
      handlers: [
        // Refresh token handler
        createPostHandler(
          'auth/refresh',
          'Body_refresh_token_v1_api_auth_refresh_post',
          'AuthResponse',
          refreshedTokens,
          {
            validateRequest: (body) => {
              refreshCallMade = true;
              return body.token === initialTokens.refresh_token;
            },
          },
        ),
      ],
    });

    // Manually set tokens after setup
    tokenService.storeTokens(initialTokens);

    // Set expiration time to 1 minute in the past (already expired)
    const expiredTime = Date.now() - 1 * 60 * 1000;
    localStorage.setItem('expires_at', expiredTime.toString());

    // Verify we have the correct initial tokens
    const storedTokens = tokenService.getStoredTokens();
    expect(storedTokens?.access_token).toBe(initialTokens.access_token);
    expect(storedTokens?.refresh_token).toBe(initialTokens.refresh_token);

    // Token should be expired
    expect(tokenService.isTokenExpired()).toBe(true);
    expect(tokenService.needsRefresh()).toBe(true);

    // Trigger manual token refresh
    await user.click(screen.getByTestId('trigger-api'));

    // Verify refresh request was made
    await waitFor(() => {
      expect(refreshCallMade).toBe(true);
    });

    // Verify tokens were updated with new values
    await waitFor(() => {
      const tokens = tokenService.getStoredTokens();
      expect(tokens?.access_token).toBe(refreshedTokens.access_token);
      expect(tokens?.refresh_token).toBe(refreshedTokens.refresh_token);
    });
  });

  test('should clear tokens on logout', async () => {
    const mockTokens = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      user: mockUser,
    };

    const { user } = await setupFeatureTest({
      routes,
      initialPath: '/',
      authenticatedUser: true,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', mockUser),
        createEmptyResponseHandler('post', 'auth/logout', { status: 204 }),
      ],
    });

    // Store initial tokens
    tokenService.storeTokens(mockTokens);
    expect(tokenService.getStoredTokens()).toBeTruthy();

    // Trigger logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    // Verify tokens are cleared
    await waitFor(() => {
      expect(tokenService.getStoredTokens()).toBeNull();
    });
  });

  test('should handle expired token', async () => {
    const mockTokens = {
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      user: mockUser,
    };

    // Create a component that will trigger a protected API call on mount
    const ProtectedComponent = () => {
      const [isLoading, setIsLoading] = React.useState(true);
      const [error, setError] = React.useState<string | null>(null);

      React.useEffect(() => {
        const fetchData = async () => {
          try {
            await authMutations.validateToken();
            setIsLoading(false);
          } catch (error) {
            setError(
              `Failed to validate token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            setIsLoading(false);
          }
        };
        fetchData();
      }, []);

      if (isLoading) return <div>Loading...</div>;
      if (error) return <div data-testid="error-message">{error}</div>;
      return <div data-testid="protected-content">Protected Content</div>;
    };

    // Create routes with the protected component
    const protectedRoutes = [
      createRouteConfig('/', <Layout />, [
        createRouteConfig('', <ProtectedComponent />),
        createRouteConfig('auth', <Auth />),
      ]),
    ];

    await setupFeatureTest({
      routes: protectedRoutes,
      initialPath: '/',
      authenticatedUser: false,
      handlers: [
        createGetHandler('auth/me', 'UserResponse', null, {
          status: 401,
        }),
      ],
    });

    // Store expired tokens
    tokenService.storeTokens(mockTokens);
    const expiredTime = Date.now() - 1000; // 1 second ago
    localStorage.setItem('expires_at', expiredTime.toString());

    // Verify token is considered expired
    expect(tokenService.isTokenExpired()).toBe(true);

    // Wait for the auth state to update
    await waitFor(() => {
      expect(tokenService.getStoredTokens()).toBeNull();
    });
  });
});
