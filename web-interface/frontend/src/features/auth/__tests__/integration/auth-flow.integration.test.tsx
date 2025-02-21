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

describe('Auth Flow Integration', () => {
  // Add handlers using schema-based generation
  addIntegrationHandlers([
    createPostHandler(
      '/v1/api/auth/login',
      'Body_login_v1_api_auth_login_post',
      'AuthResponse',
      mockAuthResponse,
    ),
    createGetHandler('/v1/api/users/me', 'UserResponse', mockUser),
  ]);

  test('successful login flow', async () => {
    render(<LoginForm onSuccess={() => {}} />);

    // Fill in login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify successful login
    await waitFor(() => {
      // No error messages should be present
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
