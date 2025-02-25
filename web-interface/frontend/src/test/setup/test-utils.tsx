import { MemoryRouter, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type PropsWithChildren } from 'react';
import { AuthProvider } from '../../features/auth/components/AuthProvider';

// Create a client for React Query
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        // Ensure queries don't refetch on window focus
        refetchOnWindowFocus: false,
        // Don't auto-invalidate queries
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface TestRouterResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

interface TestSetupOptions {
  initialRoute?: string;
  authenticated?: boolean;
  queryClient?: QueryClient;
}

/**
 * Setup function for tests that need Memory Router with a specific initial route
 */
export async function setupTestRouter({
  initialRoute = '/',
  authenticated = false,
  queryClient,
  children,
}: PropsWithChildren<TestSetupOptions>): Promise<TestRouterResult> {
  // Clear any previous auth state
  localStorage.clear();

  // Setup auth state if needed
  if (authenticated) {
    // Set tokens in a format that matches our auth response
    const authResponse = {
      access_token: 'fake_token',
      refresh_token: 'fake_refresh',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'test@example.com',
        created_at: '2024-02-23T10:00:00Z',
        personal_info: null,
      },
    };

    // Use the token service to ensure proper storage format
    const { tokenService } = await import(
      '../../features/auth/services/token-service'
    );
    tokenService.storeTokens(authResponse);

    // Wait for any promises to resolve
    await flushPromises();
  }

  const user = userEvent.setup({ delay: null });
  const client = queryClient ?? createTestQueryClient();

  // Reset query client to ensure clean state
  client.clear();

  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>{children}</Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    user,
    ...result,
  };
}

/**
 * Wait for any promises in the JavaScript job queue to resolve
 */
async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * A utility function that forces React Query and auth state to settle
 */
export async function waitForEffects(opts = { timeout: 2000 }) {
  // First wait for initial auth state and route updates
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 100));
  await flushPromises();

  // Then wait for data fetching if needed
  await new Promise((resolve) =>
    setTimeout(resolve, Math.min(opts.timeout, 2000)),
  );
}
