import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
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
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

export function ProvidersWrapper({ children }: PropsWithChildren) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[window.location.pathname]}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * A utility function that forces React Query to settle before proceeding
 * This ensures all queries/mutations have completed before making assertions
 */
// eslint-disable-next-line react-refresh/only-export-components
export const waitForQueries = async () => {
  // First wait for all queries to settle
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Then wait for any pending state updates
  await new Promise((resolve) => setTimeout(resolve, 100));
};
