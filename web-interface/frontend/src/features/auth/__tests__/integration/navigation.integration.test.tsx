import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../../../../routes/Layout';
import { Auth } from '../../../../routes/Auth';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { ROUTES } from '../../../../routes/paths';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../testing/integration-handlers';

// Helper function to setup tests with async user events
const setupNavigationTest = () => {
  return {
    user: userEvent.setup({ delay: null }),
    ...render(
      <ProvidersWrapper>
        <Routes>
          <Route element={<Layout />}>
            <Route path={ROUTES.AUTH} element={<Auth />} />
            <Route path={ROUTES.HOME} element={<div>Home</div>} index />
          </Route>
        </Routes>
      </ProvidersWrapper>,
    ),
  };
};

describe('Navigation Integration', () => {
  beforeAll(() => {
    // Set initial route to home
    window.history.pushState({}, '', '/');
  });
  beforeEach(() => {
    server.use(...authIntegrationHandlers);
    localStorage.clear();
  });

  describe('Navigation Bar Auth State', () => {
    it('should show login form when navigating to auth route', async () => {
      const { user } = setupNavigationTest();

      // Click login button
      await user.click(screen.getByText(/login/i));

      // Verify we're on the auth page
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should show correct navigation items based on auth state', async () => {
      const { user } = setupNavigationTest();

      // Initial state - unauthenticated
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();

      // Click login
      await user.click(screen.getByText(/login/i));

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // After successful login
      await waitFor(() => {
        // Login button should be hidden
        expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
        // Logout and Jobs buttons should appear
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
        expect(screen.getByText(/jobs/i)).toBeInTheDocument();
      });
    });

    it('should show login button after logout', async () => {
      const { user } = setupNavigationTest();

      // First login
      await user.click(screen.getByText(/login/i));
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for auth state update
      await waitFor(() => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
      });

      // Click logout
      await user.click(screen.getByText(/logout/i));

      // Verify navigation items reset
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
      });
    });
  });
});
