import { describe, expect, it, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { server } from '../../../../lib/test/integration/server';
import { http, HttpResponse } from 'msw';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
import { ProtectedRoute } from '../../../../routes/ProtectedRoute';
import { ROUTES } from '../../../../routes/paths';
import { authIntegrationHandlers } from '../../../auth/testing/integration-handlers';
import { jobsIntegrationHandlers } from '../../testing/integration-handlers';
import { Jobs } from '../../../jobs/components/Jobs';
import {
  setupTestRouter,
  waitForEffects,
} from '../../../../test/setup/test-utils';
import { QueryClient } from '@tanstack/react-query';

// Common route setup for all test cases
const routeConfig = (
  <Route element={<Layout />}>
    <Route path={ROUTES.AUTH} element={<Auth />} />
    <Route path={ROUTES.HOME} element={<div>Home</div>} />
    <Route element={<ProtectedRoute />}>
      <Route path={ROUTES.JOBS.LIST} element={<Jobs />} />
    </Route>
  </Route>
);

describe('Jobs Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    server.resetHandlers(
      ...authIntegrationHandlers,
      ...jobsIntegrationHandlers,
    );

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
      },
    });
  });

  describe('Jobs Page Authentication Flow', () => {
    it('should redirect to login page for unauthenticated users', async () => {
      await setupTestRouter({
        initialRoute: ROUTES.JOBS.LIST,
        authenticated: false,
        children: routeConfig,
        queryClient,
      });

      await waitForEffects();

      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it('should load jobs after successful login', async () => {
      const { user } = await setupTestRouter({
        initialRoute: ROUTES.JOBS.LIST,
        authenticated: false,
        children: routeConfig,
        queryClient,
      });

      await waitForEffects();

      // Fill in and submit login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitForEffects();

      await waitFor(
        () => {
          expect(screen.getAllByTestId('job-card')).toHaveLength(2);
        },
        { timeout: 2000 },
      );
    });

    it('should show loading state then jobs when navigating to jobs page while authenticated', async () => {
      await setupTestRouter({
        initialRoute: ROUTES.JOBS.LIST,
        authenticated: true,
        children: routeConfig,
        queryClient,
      });

      await waitForEffects();

      // Verify jobs are loaded
      await waitFor(
        () => {
          expect(screen.getAllByTestId('job-card')).toHaveLength(2);
        },
        { timeout: 2000 },
      );
    });

    it('should handle jobs loading error states', async () => {
      // Mock error response
      server.use(
        http.get('/jobs', () => {
          return HttpResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 },
          );
        }),
      );

      await setupTestRouter({
        initialRoute: ROUTES.JOBS.LIST,
        authenticated: true,
        children: routeConfig,
        queryClient,
      });

      await waitForEffects();

      // Then verify error state
      await waitFor(
        () => {
          const alert = screen.getByRole('alert');
          expect(alert).toBeInTheDocument();
          expect(alert).toHaveTextContent(/error loading jobs/i);
        },
        { timeout: 2000 },
      );
    });
  });
});
