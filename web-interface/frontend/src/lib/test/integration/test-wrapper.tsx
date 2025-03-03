import { PropsWithChildren } from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface IntegrationTestWrapperProps extends PropsWithChildren {
  initialEntries?: string[];
}

export const IntegrationTestWrapper = ({
  children,
  initialEntries,
}: IntegrationTestWrapperProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>{children}</Router>
    </QueryClientProvider>
  );
};
