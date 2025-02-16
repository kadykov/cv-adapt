import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
function render(
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    }),
    ...renderOptions
  } = {}
) {
  // Create router wrapper with custom initial entries
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...rtlRender(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  };
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render };

// Export test providers separately for cases where we need more control
export function TestProviders({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) {
  const client = queryClient ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Test query client factory
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom test wrapper for hooks
export function renderHook<Result>(
  callback: () => Result,
  {
    wrapper,
    ...options
  }: { wrapper?: React.ComponentType<{ children: React.ReactNode }> } & Parameters<typeof rtlRender>[1] = {}
) {
  let hookResult: Result | undefined;

  function TestComponent() {
    hookResult = callback();
    return null;
  }

  const { rerender: baseRerender, ...utils } = rtlRender(<TestComponent />, { wrapper });

  const rerender = () => {
    baseRerender(<TestComponent />);
    return hookResult!;
  };

  return {
    result: hookResult!,
    rerender,
    ...utils,
  };
}

// Test data helpers
export const createTestId = (prefix: string) => (suffix: string | number) => `${prefix}-${suffix}`;

// Accessibility test helpers
export const getByAriaLabel = (container: HTMLElement, label: string): HTMLElement | null =>
  container.querySelector(`[aria-label="${label}"]`);

export const getByTestId = (container: HTMLElement, testId: string): HTMLElement | null =>
  container.querySelector(`[data-testid="${testId}"]`);
