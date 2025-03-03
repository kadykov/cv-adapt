import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, type RouteObject } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import type { FC, PropsWithChildren } from 'react';
import React from 'react';
import { IntegrationTestWrapper } from './test-wrapper';
import type {
  RouteTestOptions,
  FeatureTestOptions,
  TestContext,
} from './navigation-utils';
import { server } from './server';
import { authIntegrationHandlers } from '../../../features/auth/testing/integration-handlers';
import { setupAuthenticatedState } from '../../../features/auth/testing/setup';

interface WrapperProps {
  children: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
const TestWrapper: FC<WrapperProps & { initialEntries: string[] }> = ({
  children,
  initialEntries,
}) => (
  <IntegrationTestWrapper initialEntries={initialEntries}>
    {children}
  </IntegrationTestWrapper>
);

const renderRoute = (route: RouteObject): React.ReactNode => {
  const { path, element, children } = route;
  return (
    <Route key={path} path={path} element={element}>
      {children?.map(renderRoute)}
    </Route>
  );
};

/**
 * Setup base test environment for route testing
 */
export const setupRouteTest = async (
  options: RouteTestOptions,
): Promise<TestContext & { wrapper: RenderResult }> => {
  // Clear any previous state
  localStorage.clear();

  // Setup query client
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: Infinity,
        },
      },
    });

  // Setup auth state if needed
  if (options.authenticatedUser) {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());
    setupAuthenticatedState(queryClient);
  }

  // Setup auth handlers
  server.use(...authIntegrationHandlers);

  // Setup user events
  const user = userEvent.setup();

  // Create routes element
  const routeElements = <Routes>{options.routes?.map(renderRoute)}</Routes>;

  // Render with test wrapper
  const wrapper = render(routeElements, {
    wrapper: ({ children }: PropsWithChildren) => (
      <TestWrapper initialEntries={[options.initialPath]}>
        {children}
      </TestWrapper>
    ),
  });

  return { user, queryClient, wrapper };
};

/**
 * Setup test environment for feature testing
 */
export const setupFeatureTest = async (
  options: FeatureTestOptions,
): Promise<TestContext & { wrapper: RenderResult }> => {
  // Setup route test base
  const context = await setupRouteTest(options);

  // Setup additional handlers
  if (options.handlers) {
    server.use(...options.handlers);
  }

  return context;
};

/**
 * Helper to create a route configuration object
 */
export const createRouteConfig = (
  path: string,
  element: React.ReactNode,
  children?: RouteObject[],
): RouteObject => ({
  path,
  element,
  children,
});
