import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/tests/test-utils';
import { createTestHelpers } from '@/tests/setup';
import Login from '@/pages/login';
import type { AuthResponse } from '@/types/api';

const mockAuthResponse: AuthResponse = {
  access_token: 'test_token',
  refresh_token: 'test_refresh',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
};

describe('Login Page', () => {
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    simulateSuccess('/api/v1/auth/login', 'post', mockAuthResponse);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Should redirect to jobs page after successful login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs');
    });
  });

  it('handles login failure', async () => {
    simulateError(
      '/api/v1/auth/login',
      'post',
      401,
      'Invalid credentials'
    );

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Should stay on login page
    expect(window.location.pathname).toBe('/login');
  });

  it('shows loading state during login', async () => {
    simulateLoading('/api/v1/auth/login', 'post', 1000);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Set up success response after loading
    simulateSuccess('/api/v1/auth/login', 'post', mockAuthResponse);

    // Should complete loading
    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs');
    });
  });

  it('handles network error', async () => {
    simulateError(
      '/api/v1/auth/login',
      'post',
      0,
      'Network Error'
    );

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('navigates to register page', async () => {
    render(<Login />);

    const registerLink = screen.getByRole('link', { name: /register here/i });
    await userEvent.click(registerLink);

    expect(window.location.pathname).toBe('/register');
  });

  it('prevents multiple submissions while loading', async () => {
    simulateLoading('/api/v1/auth/login', 'post', 1000);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    // Try clicking again while loading
    await userEvent.click(submitButton);

    // Should still be in loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Set up success response
    simulateSuccess('/api/v1/auth/login', 'post', mockAuthResponse);

    // Should complete loading
    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs');
    });
  });
});
