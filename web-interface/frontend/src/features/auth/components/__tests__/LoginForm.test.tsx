/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockOnSuccess = vi.fn();
const mockMutateAsync = vi.fn();

const mockMutationState = {
  isPending: false,
};

vi.mock('../../hooks', () => ({
  useLoginMutation: () => ({
    mutateAsync: (...args: unknown[]) => {
      mockMutationState.isPending = true;
      return mockMutateAsync(...args).finally(() => {
        mockMutationState.isPending = false;
      });
    },
    error: undefined,
    get isPending() {
      return mockMutationState.isPending;
    },
  }),
}));

// Regular imports after mocks
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '../LoginForm';
import { createTestQueryClient } from '../../testing';
import '@testing-library/jest-dom';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationState.isPending = false;
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

    expect(mockMutateAsync).not.toHaveBeenCalled();
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

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderForm();
    const user = userEvent.setup();

    // Enter valid data
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await submitForm(user);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  it('shows loading state during submission', async () => {
    mockMutateAsync.mockImplementationOnce(
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
    mockMutateAsync.mockResolvedValueOnce({});
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await submitForm(user);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // onSuccess should only be called after login is successful
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderForm();
    const user = userEvent.setup();

    // Submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    const submitButton = await submitForm(user);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).not.toHaveAttribute('data-disabled');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
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
