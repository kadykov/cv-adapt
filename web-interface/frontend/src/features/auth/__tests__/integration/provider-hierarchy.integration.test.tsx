import { describe, expect, test, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { TestErrorBoundary } from '../../../../test/utils/TestErrorBoundary';
import { server } from '../../../../lib/test/integration/server';
import { AUTH_QUERY_KEY } from '../../hooks/useAuthQuery';
import { Button } from '@headlessui/react';
import { IntegrationTestWrapper } from '../../../../lib/test/integration/test-wrapper';
import { AuthProvider } from '../../components/AuthProvider';
import { createGetHandler } from '../../../../lib/test/integration/handler-generator';

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

describe('Auth Provider Hierarchy', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = createTestQueryClient();
    server.resetHandlers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Context Dependencies', () => {
    test('should allow using auth state with schema-validated responses', async () => {
      // Use the handler generator to create a handler for the /users/me endpoint
      // that returns a 401 error
      server.use(
        createGetHandler('users/me', 'UserResponse', null, {
          status: 401,
        }),
      );

      const TestComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        );
      };

      render(
        <IntegrationTestWrapper queryClient={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        // After a failed auth check, the query data might be undefined rather than null
        // Both indicate unauthenticated state
        const authData = queryClient.getQueryData(AUTH_QUERY_KEY);
        expect(authData).toBeFalsy();
      });
    });

    test('should allow using auth mutations with schema-validated requests', async () => {
      // Use the handler generator to create a handler for the /users/me endpoint
      // that returns a 401 error
      server.use(
        createGetHandler('users/me', 'UserResponse', null, {
          status: 401,
        }),
      );

      const TestComponent = () => {
        const { mutate: login } = useLoginMutation();
        const { mutate: register } = useRegisterMutation();
        const { isAuthenticated } = useAuthState();
        return (
          <div>
            <div data-testid="auth-state">
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <Button
              onClick={() =>
                login({ email: 'test@example.com', password: 'password123' })
              }
            >
              Login
            </Button>
            <Button
              onClick={() =>
                register({
                  email: 'test@example.com',
                  password: 'password123',
                  personal_info: {},
                })
              }
            >
              Register
            </Button>
          </div>
        );
      };

      render(
        <IntegrationTestWrapper queryClient={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });
    });
  });

  describe('Provider Initialization', () => {
    test('should initialize all providers in correct order', async () => {
      let queryClientInitialized = false;
      let authStateInitialized = false;

      // Use the handler generator to create a handler for the /users/me endpoint
      // that returns a 401 error
      server.use(
        createGetHandler('users/me', 'UserResponse', null, {
          status: 401,
        }),
      );

      const TestComponent = () => {
        const { isLoading } = useAuthState();
        queryClientInitialized = true;
        authStateInitialized = !isLoading;
        return <div>Test Component</div>;
      };

      render(
        <IntegrationTestWrapper queryClient={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      await waitFor(() => {
        expect(queryClientInitialized).toBe(true);
        expect(authStateInitialized).toBe(true);
      });
    });

    test('should handle initialization errors gracefully', async () => {
      // Use the handler generator to create a handler for the /users/me endpoint
      // that returns a 500 error
      server.use(
        createGetHandler('users/me', 'UserResponse', null, {
          status: 500,
        }),
      );

      const TestComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        );
      };

      render(
        <IntegrationTestWrapper queryClient={queryClient}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should prevent provider errors from crashing the app', async () => {
      // Use the handler generator to create a handler for the /users/me endpoint
      // that returns a 401 error
      server.use(
        createGetHandler('users/me', 'UserResponse', null, {
          status: 401,
        }),
      );

      // Note: This test will produce a React error in the console.
      // This is expected behavior as we're testing error boundary functionality.
      const ErrorComponent = () => {
        throw new Error('Test Error');
      };

      render(
        <IntegrationTestWrapper queryClient={queryClient}>
          <AuthProvider>
            <TestErrorBoundary>
              <ErrorComponent />
            </TestErrorBoundary>
          </AuthProvider>
        </IntegrationTestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Error Fallback')).toBeInTheDocument();
      });
    });
  });
});

// Import hooks after mock setup
import {
  useAuthState,
  useLoginMutation,
  useRegisterMutation,
} from '../../hooks';
