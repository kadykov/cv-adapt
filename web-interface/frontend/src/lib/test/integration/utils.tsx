import {
  render as rtlRender,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { RouterWrapper } from './wrappers';
import { QueryClient } from '@tanstack/react-query';
import { IntegrationTestWrapper } from './components';
import { type TestOptions } from './types';

// Create a test QueryClient with specific integration test settings
export function createIntegrationTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Custom render function for integration tests
export function render(ui: ReactElement, options: TestOptions = {}) {
  const { initialEntries, routerComponent, ...restOptions } = options;

  function CombinedWrapper({ children }: { children: ReactNode }) {
    // If initialEntries is provided, use memory router with those entries
    if (initialEntries) {
      return (
        <IntegrationTestWrapper
          routerComponent={(props) => (
            <RouterWrapper initialEntries={initialEntries} {...props} />
          )}
        >
          {children}
        </IntegrationTestWrapper>
      );
    }

    // Otherwise, use the provided router or default
    return (
      <IntegrationTestWrapper routerComponent={routerComponent}>
        {children}
      </IntegrationTestWrapper>
    );
  }

  return rtlRender(ui, { wrapper: CombinedWrapper, ...restOptions });
}

// Export commonly used testing utilities
export { screen, fireEvent, waitFor, within };
