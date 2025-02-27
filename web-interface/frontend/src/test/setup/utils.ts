import { QueryClient } from '@tanstack/react-query';

// Create a client for React Query
export const createTestQueryClient = () =>
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

/**
 * A utility function that forces React Query and routing to settle before proceeding
 * This ensures all queries/mutations and route transitions have completed before making assertions
 */
export const waitForQueries = async () => {
  // First wait for React Query's internal timing
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Then wait for React Router transitions and state batching
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Finally wait for any pending state updates and Suspense boundaries
  await new Promise((resolve) => setTimeout(resolve, 50));
};
