import { type ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider } from '../../../features/auth/components/AuthProvider';
import { MemoryRouter } from 'react-router-dom';
import { createIntegrationTestQueryClient } from './utils';

type WrapperProps = {
  children: ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
  routerComponent?: React.ComponentType<{ children: ReactNode }>;
};

// Integration test wrapper that provides all necessary context
export function IntegrationTestWrapper({
  children,
  initialEntries = ['/'],
  queryClient = createIntegrationTestQueryClient(),
  routerComponent: RouterComponent = (props) => (
    <MemoryRouter initialEntries={initialEntries}>
      {props.children}
    </MemoryRouter>
  ),
}: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent>
        <AuthProvider>{children}</AuthProvider>
      </RouterComponent>
    </QueryClientProvider>
  );
}
