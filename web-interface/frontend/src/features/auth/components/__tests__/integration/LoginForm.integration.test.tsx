import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { createHandlers } from '@/tests/setup';
import { LoginForm } from '../../LoginForm';
import type { components } from '@/types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];

describe('LoginForm Integration Tests', () => {
  const handlers = createHandlers();
  const mockAuthResponse: AuthResponse = {
    access_token: 'mock_token',
    refresh_token: 'mock_refresh',
    token_type: 'bearer',
    user: {
      id: 1,
      email: 'test@example.com',
      created_at: new Date().toISOString()
    }
  };

  it('completes successful login flow with valid response', async () => {
    // Use generated handler with OpenAPI schema validation
    handlers.auth.login.success(mockAuthResponse);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify success state and navigation
    expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('handles invalid credentials with error response schema', async () => {
    // Use generated handler's error response that follows API schema
    handlers.auth.login.error(401, 'Invalid email or password');

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify error handling with schema-valid response
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('handles server errors with standard error schema', async () => {
    // Use generated handler with standard error schema
    handlers.auth.login.error(503, 'Service temporarily unavailable');

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify error handling follows API contract
    expect(await screen.findByText(/service temporarily unavailable/i)).toBeInTheDocument();
  });

  it('validates response against OpenAPI schema', async () => {
    // Use generated handler that validates against OpenAPI schema
    handlers.auth.login.success({
      // Intentionally missing required field to test schema validation
      access_token: 'mock_token',
      refresh_token: 'mock_refresh',
      // type and user fields missing
    } as AuthResponse);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // The test should fail with schema validation error from MSW handler
    // because response doesn't match OpenAPI schema
    await expect(screen.findByText(/welcome/i)).rejects.toThrow();
  });
});
