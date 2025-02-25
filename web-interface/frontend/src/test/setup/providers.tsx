import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useMemo } from 'react';
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
  const queryClient = useMemo(() => createTestQueryClient(), []);

  // Clean up query cache on unmount
  useEffect(() => {
    return () => {
      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[window.location.pathname]}
        initialIndex={0}
      >
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * A utility function that forces React Query and routing to settle before proceeding
 * This ensures all queries/mutations and route transitions have completed before making assertions
 */
// eslint-disable-next-line react-refresh/only-export-components
export const waitForQueries = async () => {
  // First wait for React Query's internal timing
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Then wait for React Router transitions and state batching
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Finally wait for any pending state updates and Suspense boundaries
  await new Promise((resolve) => setTimeout(resolve, 50));
};
