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
export function setupTestRouter({
  initialRoute = '/',
  authenticated = false,
  queryClient,
  children,
}: PropsWithChildren<TestSetupOptions>): TestRouterResult {
  // Clear any previous auth state
  localStorage.clear();

  // Setup auth state if needed
  if (authenticated) {
    localStorage.setItem('access_token', 'fake_token');
    localStorage.setItem('refresh_token', 'fake_refresh');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString()); // 1 hour from now
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
