import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useMemo } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/components/AuthProvider';
import { createTestQueryClient } from './utils';

export function ProvidersWrapper({
  children,
  initialEntries = [window.location.pathname],
}: PropsWithChildren<{ initialEntries?: string[] }>) {
  const queryClient = useMemo(() => createTestQueryClient(), []);

  // Clean up query cache on unmount
  useEffect(() => {
    return () => {
      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
