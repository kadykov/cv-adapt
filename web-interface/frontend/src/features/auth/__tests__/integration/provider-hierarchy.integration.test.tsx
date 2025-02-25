import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { TestErrorBoundary } from '../../../../test/utils/TestErrorBoundary';
import { server } from '../../../../lib/test/integration/server';
import { http, HttpResponse } from 'msw';

// Register MSW handlers for this test suite
beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

describe('Auth Provider Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.resetHandlers();
    localStorage.clear();
  });

  describe('Context Dependencies', () => {
    it('should allow using auth context with schema-validated responses', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        );
      };

      render(
        <ProvidersWrapper>
          <TestComponent />
        </ProvidersWrapper>,
      );

      // Wait for auth state to settle
      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });

    it('should allow using auth mutations with schema-validated requests', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      const TestComponent = () => {
        useLoginMutation();
        useRegisterMutation();
        return <div>Test Component</div>;
      };

      render(
        <ProvidersWrapper>
          <TestComponent />
        </ProvidersWrapper>,
      );

      // Wait for component to mount and auth state to settle
      await waitFor(() => {
        expect(screen.getByText('Test Component')).toBeInTheDocument();
      });
    });
  });

  describe('Provider Initialization', () => {
    it('should initialize all providers in correct order with valid responses', async () => {
      let queryClientMounted = false;
      let authProviderMounted = false;

      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }),
      );

      const TestComponent = () => {
        const auth = useAuth();
        authProviderMounted = true;
        queryClientMounted = !!auth;
        return <div>Test Component</div>;
      };

      render(
        <ProvidersWrapper>
          <TestComponent />
        </ProvidersWrapper>,
      );

      // Wait for providers to mount
      await waitFor(() => {
        expect(queryClientMounted).toBe(true);
        expect(authProviderMounted).toBe(true);
      });
    });

    it('should handle initialization errors gracefully', async () => {
      server.use(
        http.get('/api/auth/validate', () => {
          return HttpResponse.error();
        }),
      );

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        );
      };

      render(
        <ProvidersWrapper>
          <TestComponent />
        </ProvidersWrapper>,
      );

      // Wait for auth state to settle
      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should prevent provider errors from crashing the app', async () => {
      // Set up auth mock to prevent auth-related errors
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
        <ProvidersWrapper>
          <TestErrorBoundary>
            <ErrorComponent />
          </TestErrorBoundary>
        </ProvidersWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText('Error Fallback')).toBeInTheDocument();
      });
    });
  });
});

// Import hooks after the mock is set up
const { useAuth, useLoginMutation, useRegisterMutation } = await import(
  '../../hooks/index'
);
