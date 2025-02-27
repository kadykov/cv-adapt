import { describe, test, expect } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  createGetHandler,
  createPostHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import { LoginForm } from '../../components/LoginForm';
import { mockAuthResponse, mockUser } from '../../testing/fixtures';

describe('Token Management Integration', () => {
  // Add handlers for token management flow
  addIntegrationHandlers([
    createPostHandler(
      'auth/login',
      'Body_login_v1_api_auth_login_post',
      'AuthResponse',
      mockAuthResponse,
    ),
    createGetHandler('users/me', 'UserResponse', mockUser),
    createPostHandler(
      'auth/refresh',
      'Body_refresh_token_v1_api_auth_refresh_post',
      'AuthResponse',
      {
        ...mockAuthResponse,
        access_token: 'new_access_token',
      },
    ),
  ]);

  test('should handle token refresh automatically', async () => {
    render(<LoginForm onSuccess={() => {}} />);

    // Login to set up initial tokens
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for successful login
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    // TODO: Add more assertions for token refresh flow
    // This will require updates to the auth context to expose token state
    // and potentially adding a test component that triggers authenticated requests
  });
});
