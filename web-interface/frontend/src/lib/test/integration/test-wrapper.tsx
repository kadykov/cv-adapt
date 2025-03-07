import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface IntegrationTestWrapperProps extends PropsWithChildren {
  initialEntries?: string[];
  initialIndex?: number;
  queryClient?: QueryClient;
}

export const IntegrationTestWrapper = ({
  children,
  initialEntries,
  initialIndex,
  queryClient,
}: IntegrationTestWrapperProps) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const client = queryClient ?? defaultQueryClient;

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={initialEntries ?? ['/']}
        initialIndex={initialIndex ?? 0}
      >
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};
