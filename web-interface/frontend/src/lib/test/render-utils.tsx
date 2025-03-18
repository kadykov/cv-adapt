import { render } from '@testing-library/react';
import { MemoryRouter, useNavigate, NavigateFunction } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import type { Mock } from 'vitest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

interface RenderWithRouterOptions {
  initialEntries?: string[];
  mockNavigate?: Mock;
}

/**
 * Component that injects mocked navigation if provided
 */
export function MockRouterComponent({
  children,
  mockNavigate,
}: {
  children: ReactNode;
  mockNavigate?: Mock;
}) {
  const navigate = useNavigate();

  if (mockNavigate) {
    // Override navigate function while preserving its type
    const mockedNavigate = mockNavigate as unknown as NavigateFunction;
    Object.defineProperty(navigate, 'length', {
      value: mockNavigate.length,
      configurable: true,
    });
    Object.assign(navigate, mockedNavigate);
  }

  return children;
}

/**
 * Renders component with Router and optional navigation mocking
 * @returns Render result with additional mock functions
 */
export function renderWithRouter(
  ui: ReactNode,
  options: RenderWithRouterOptions = {}
) {
  const { initialEntries = ['/'], mockNavigate } = options;

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <MockRouterComponent mockNavigate={mockNavigate}>
            {ui}
          </MockRouterComponent>
        </MemoryRouter>
      </QueryClientProvider>
    ),
    mockNavigate
  };
}

/**
 * Creates a mock query client for testing
 * @returns QueryClient configured for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a wrapper with router and query client for testing hooks
 * @param options Router options and navigation mocking
 */
export function createTestWrapper(options: RenderWithRouterOptions = {}) {
  const { initialEntries = ['/'], mockNavigate } = options;
  const testQueryClient = createTestQueryClient();

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <MockRouterComponent mockNavigate={mockNavigate}>
            {children}
          </MockRouterComponent>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}
