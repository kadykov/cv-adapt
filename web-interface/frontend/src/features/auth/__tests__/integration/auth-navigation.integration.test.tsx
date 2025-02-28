import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../testing/integration-handlers';
import { AuthProvider } from '../../components/AuthProvider';
import { tokenService } from '../../services/token-service';

// Global query client for consistent caching behavior
let queryClient: QueryClient;

// Helper function to setup test app with all required providers
const setupTest = (component: React.ReactElement) => {
  // Create a new QueryClient for each test
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
    },
  });

  // Force fetch new data instead of using cache
  queryClient.clear();

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  );

  return {
    user: userEvent.setup({ delay: null }),
    queryClient,
    ...utils,
  };
};

describe('Auth Navigation Integration', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.use(...authIntegrationHandlers);
    localStorage.clear();
    window.history.pushState({}, '', '/');
    queryClient?.clear();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });

  describe('Authentication State Persistence', () => {
    it('should maintain auth state after navigation and remounting', async () => {
      // Step 1: Initial render and login
      const { user, queryClient, unmount } = setupTest(<Auth />);

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for successful login
      await waitFor(() => {
        expect(tokenService.getAccessToken()).toBeTruthy();
      });

      // Step 2: Unmount the entire app (simulating navigation)
      unmount();

      // Clear React Query cache to simulate fresh page load
      queryClient.clear();

      // Step 3: Remount with Layout component to verify navigation state
      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <Layout />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>,
      );

      // Verify auth state is preserved
      await waitFor(() => {
        // Logout button should be present
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
        // Jobs link should be present
        expect(screen.getByText(/jobs/i)).toBeInTheDocument();
        // Login button should not be present
        expect(screen.queryByText(/^login$/i)).not.toBeInTheDocument();
      });
    });

    it('should clear auth state after logout', async () => {
      // Start with tokens in localStorage
      const mockTokens = {
        access_token: 'fake_token',
        refresh_token: 'fake_refresh',
      };
      tokenService.storeTokens({
        ...mockTokens,
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          personal_info: null,
        },
      });

      // Mount Layout to show navigation
      const { user } = setupTest(<Layout />);

      // Wait for auth state to be loaded
      await waitFor(() => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
      });

      // Click logout
      await user.click(screen.getByText(/logout/i));

      // Verify auth state is cleared
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
        expect(tokenService.getAccessToken()).toBeNull();
      });
    });

    it('should handle initial load with valid tokens', async () => {
      // Setup tokens in localStorage before mounting
      const mockTokens = {
        access_token: 'fake_token',
        refresh_token: 'fake_refresh',
      };
      tokenService.storeTokens({
        ...mockTokens,
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          personal_info: null,
        },
      });

      // Mount Layout
      setupTest(<Layout />);

      // Verify auth state is loaded from tokens
      await waitFor(() => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
        expect(screen.getByText(/jobs/i)).toBeInTheDocument();
        expect(screen.queryByText(/^login$/i)).not.toBeInTheDocument();
      });
    });

    it('should handle invalid tokens on initial load', async () => {
      // Setup invalid tokens in localStorage
      localStorage.setItem('access_token', 'invalid_token');
      localStorage.setItem('refresh_token', 'invalid_refresh');

      // Mount Layout
      setupTest(<Layout />);

      // Verify auth state is cleared and user is logged out
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
        expect(tokenService.getAccessToken()).toBeNull();
      });
    });
  });
});
