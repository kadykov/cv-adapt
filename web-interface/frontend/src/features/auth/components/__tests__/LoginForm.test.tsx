import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../../context';
import { LoginForm } from '../LoginForm';
import { createTestQueryClient } from '../../testing';
import '@testing-library/jest-dom';

// Mock useAuth hook
vi.mock('../../context', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('LoginForm', () => {
  const mockLoginWithCredentials = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      loginWithCredentials: mockLoginWithCredentials,
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
    });
    mockLoginWithCredentials.mockReset();
    mockOnSuccess.mockReset();
  });

  const renderForm = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>,
    );
  };

  const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    return submitButton;
  };

  it('validates required fields', async () => {
    renderForm();
    const user = userEvent.setup();

    await submitForm(user);

    await waitFor(() => {
      const emailError = screen.getByText(/invalid email address/i);
      const passwordError = screen.getByText(/password is required/i);
      expect(emailError).toBeInTheDocument();
      expect(passwordError).toBeInTheDocument();
    });

    expect(mockLoginWithCredentials).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    renderForm();
    const user = userEvent.setup();

    // Enter invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await submitForm(user);

    await waitFor(() => {
      const emailError = screen.getByText(/invalid email address/i);
      expect(emailError).toBeInTheDocument();
    });

    expect(mockLoginWithCredentials).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderForm();
    const user = userEvent.setup();

    // Enter valid data
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await submitForm(user);

    await waitFor(() => {
      expect(mockLoginWithCredentials).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  it('shows loading state during submission', async () => {
    mockLoginWithCredentials.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    renderForm();
    const user = userEvent.setup();

    // Submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    const submitButton = await submitForm(user);

    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/signing in/i);
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls onSuccess after successful login', async () => {
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await submitForm(user);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    mockLoginWithCredentials.mockRejectedValue(
      new Error('Invalid credentials'),
    );
    renderForm();
    const user = userEvent.setup();

    // Submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    const submitButton = await submitForm(user);

    await waitFor(() => {
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).not.toHaveAttribute('data-disabled');
    });
  });

  it('shows hover styles on form elements', async () => {
    renderForm();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.hover(emailInput);
    expect(emailInput).toHaveAttribute('data-hover');

    await user.hover(passwordInput);
    expect(passwordInput).toHaveAttribute('data-hover');

    await user.hover(submitButton);
    expect(submitButton).toHaveAttribute('data-hover');
  });
});
