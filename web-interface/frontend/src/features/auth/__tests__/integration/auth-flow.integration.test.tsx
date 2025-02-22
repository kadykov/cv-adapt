import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../components/LoginForm';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { useAuth } from '../../auth-context';
import { authIntegrationHandlers } from '../../testing/integration-handlers';

// Helper function to setup tests with async user events
const setupAuthTest = (ui: React.ReactElement) => {
  return {
    user: userEvent.setup({ delay: null }),
    ...render(<ProvidersWrapper>{ui}</ProvidersWrapper>),
  };
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    server.use(...authIntegrationHandlers);
    localStorage.clear();
  });

  describe('Provider Hierarchy', () => {
    it('should initialize AuthProvider without errors', async () => {
      setupAuthTest(<div data-testid="test-component">Test Component</div>);
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });

    it('should properly initialize auth state using schema-validated responses', async () => {
      const AuthStateComponent = () => {
        const auth = useAuth();
        return (
          <div data-testid="auth-state">
            {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </div>
        );
      };

      setupAuthTest(<AuthStateComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });
    });
  });

  describe('Login Flow', () => {
    it('should successfully handle login with schema-validated requests/responses', async () => {
      const onSuccess = vi.fn();
      const { user } = setupAuthTest(<LoginForm onSuccess={onSuccess} />);

      // Fill in form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should call success callback
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 },
      );
    });

    it('should handle login errors with schema-validated error responses', async () => {
      const { user } = setupAuthTest(<LoginForm onSuccess={() => {}} />);

      // Fill in form with wrong password
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(
        () => {
          const errorMessage = screen.getByRole('alert');
          expect(errorMessage).toHaveTextContent(/invalid credentials/i);
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Auth State Management', () => {
    it('should maintain auth state after login', async () => {
      const AuthStateComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="auth-state">
              {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <LoginForm onSuccess={() => {}} />
          </div>
        );
      };

      const { user } = setupAuthTest(<AuthStateComponent />);

      // Wait for initial state
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent(
          'Not Authenticated',
        );
      });

      // Perform login
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for auth state to update
      await waitFor(
        () => {
          expect(screen.getByTestId('auth-state')).toHaveTextContent(
            'Authenticated',
          );
        },
        { timeout: 2000 },
      );
    });
  });
});
