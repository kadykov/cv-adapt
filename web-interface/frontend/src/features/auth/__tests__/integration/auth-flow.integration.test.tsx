import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '../../components/LoginForm';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { useAuthState } from '../../hooks';
import { authIntegrationHandlers } from '../../testing/integration-handlers';
import { AUTH_QUERY_KEY } from '../../hooks/useAuthQuery';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

// Helper function to setup tests with async user events and QueryClient
const setupAuthTest = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return {
    user: userEvent.setup({ delay: null }),
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ProvidersWrapper>{ui}</ProvidersWrapper>
      </QueryClientProvider>,
    ),
  };
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    server.use(...authIntegrationHandlers);
    localStorage.clear();
  });

  describe('Provider Hierarchy', () => {
    it('should initialize AuthProvider without errors', async () => {
      setupAuthTest(<div data-testid="test-component">Test Component</div>);
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should properly initialize auth state using schema-validated responses', async () => {
      const AuthStateComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div data-testid="auth-state">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        );
      };

      setupAuthTest(<AuthStateComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });
    });
  });

  describe('Login Flow', () => {
    it('should successfully handle login with schema-validated requests/responses', async () => {
      const onSuccess = vi.fn();
      const { user, queryClient } = setupAuthTest(
        <LoginForm onSuccess={onSuccess} />,
      );

      // Fill in form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should call success callback and update auth state
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(queryClient.getQueryData(AUTH_QUERY_KEY)).not.toBeNull();
      });
    });

    it('should handle login errors with schema-validated error responses', async () => {
      const { user, queryClient } = setupAuthTest(
        <LoginForm onSuccess={() => {}} />,
      );

      // Fill in form with wrong password
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message and maintain unauthenticated state
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(/invalid credentials/i);
        // After a failed login, the query data might be undefined rather than null
        // Both indicate unauthenticated state
        const authData = queryClient.getQueryData(AUTH_QUERY_KEY);
        expect(authData).toBeFalsy();
      });
    });
  });

  describe('Auth State Management', () => {
    it('should maintain auth state after login', async () => {
      const AuthStateComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div>
            <div data-testid="auth-state">
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <LoginForm onSuccess={() => {}} />
          </div>
        );
      };

      const { user, queryClient } = setupAuthTest(<AuthStateComponent />);

      // Wait for initial state
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });

      // Perform login
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for auth state to update
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Authenticated',
        );
        expect(queryClient.getQueryData(AUTH_QUERY_KEY)).not.toBeNull();
      });
    });
  });
});
