import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { TestErrorBoundary } from '../../../../test/utils/TestErrorBoundary';
import { server } from '../../../../lib/test/integration/server';
import { AUTH_QUERY_KEY } from '../../hooks/useAuthQuery';
import { http, HttpResponse } from 'msw';
import { Button } from '@headlessui/react';

// Register MSW handlers for this test suite
beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.resetHandlers();
    localStorage.clear();
  });

  describe('Context Dependencies', () => {
    it('should allow using auth state with schema-validated responses', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      const TestComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ProvidersWrapper>
            <TestComponent />
          </ProvidersWrapper>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
        // After a failed auth check, the query data might be undefined rather than null
        // Both indicate unauthenticated state
        const authData = queryClient.getQueryData(AUTH_QUERY_KEY);
        expect(authData).toBeFalsy();
      });
    });

    it('should allow using auth mutations with schema-validated requests', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
                register({ email: 'test@example.com', password: 'password123' })
              }
            >
              Register
            </Button>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ProvidersWrapper>
            <TestComponent />
          </ProvidersWrapper>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });
    });
  });

  describe('Provider Initialization', () => {
    it('should initialize all providers in correct order', async () => {
      let queryClientInitialized = false;
      let authStateInitialized = false;

      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      const TestComponent = () => {
        const { isLoading } = useAuthState();
        queryClientInitialized = true;
        authStateInitialized = !isLoading;
        return <div>Test Component</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ProvidersWrapper>
            <TestComponent />
          </ProvidersWrapper>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(queryClientInitialized).toBe(true);
        expect(authStateInitialized).toBe(true);
      });
    });

    it('should handle initialization errors gracefully', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.error();
        }),
      );

      const TestComponent = () => {
        const { isAuthenticated } = useAuthState();
        return (
          <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ProvidersWrapper>
            <TestComponent />
          </ProvidersWrapper>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should prevent provider errors from crashing the app', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      // Note: This test will produce a React error in the console.
      // This is expected behavior as we're testing error boundary functionality.
      const ErrorComponent = () => {
        throw new Error('Test Error');
      };

      render(
        <QueryClientProvider client={queryClient}>
          <ProvidersWrapper>
            <TestErrorBoundary>
              <ErrorComponent />
            </TestErrorBoundary>
          </ProvidersWrapper>
        </QueryClientProvider>,
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
