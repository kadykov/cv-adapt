import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/tests/test-utils';
import { createTestHelpers } from '@/tests/setup';
import Register from '@/pages/register';
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

describe('Register Page', () => {
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

  beforeEach(() => {
    localStorage.clear();
    // Reset timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders registration form', () => {
    render(<Register />);

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in here/i })).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    simulateSuccess('/api/v1/auth/register', 'post', mockAuthResponse);

    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });

    // Should redirect to login after delay
    vi.advanceTimersByTime(2000);
    expect(window.location.pathname).toBe('/login');
  });

  it('validates password match', async () => {
    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password456');
    await userEvent.click(submitButton);

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('validates password length', async () => {
    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmPasswordInput, 'short');
    await userEvent.click(submitButton);

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('handles registration failure', async () => {
    simulateError(
      '/api/v1/auth/register',
      'post',
      400,
      'Email already exists'
    );

    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    // Should stay on register page
    expect(window.location.pathname).toBe('/register');
  });

  it('shows loading state during registration', async () => {
    simulateLoading('/api/v1/auth/register', 'post', 1000);

    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Set up success response after loading
    simulateSuccess('/api/v1/auth/register', 'post', mockAuthResponse);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    simulateError(
      '/api/v1/auth/register',
      'post',
      0,
      'Network Error'
    );

    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('navigates to login page', async () => {
    render(<Register />);

    const loginLink = screen.getByRole('link', { name: /sign in here/i });
    await userEvent.click(loginLink);

    expect(window.location.pathname).toBe('/login');
  });

  it('prevents multiple submissions while loading', async () => {
    simulateLoading('/api/v1/auth/register', 'post', 1000);

    render(<Register />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account$/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Try clicking again while loading
    await userEvent.click(submitButton);

    // Should still be in loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Set up success response
    simulateSuccess('/api/v1/auth/register', 'post', mockAuthResponse);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });
});
