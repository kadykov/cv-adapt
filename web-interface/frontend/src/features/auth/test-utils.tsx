import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from './context';

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-16T00:00:00Z',
  personal_info: null,
};

export const mockAuthResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser,
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

type CustomRenderOptions = {
  queryClient?: QueryClient;
} & Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactNode,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }

  const utils = render(ui, {
    wrapper: TestWrapper,
    ...renderOptions,
  });

  return { ...utils };
}

export function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}
