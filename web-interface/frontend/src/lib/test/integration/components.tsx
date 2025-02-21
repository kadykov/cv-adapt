import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../features/auth/context';
import { BrowserRouter } from 'react-router-dom';
import { createIntegrationTestQueryClient } from './utils';

type WrapperProps = {
  children: ReactNode;
  routerComponent?: React.ComponentType<{ children: ReactNode }>;
};

// Integration test wrapper that provides all necessary context
export function IntegrationTestWrapper({
  children,
  routerComponent: RouterComponent = BrowserRouter,
}: WrapperProps) {
  const queryClient = createIntegrationTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent>
        <AuthProvider>{children}</AuthProvider>
      </RouterComponent>
    </QueryClientProvider>
  );
}
