/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockOnSuccess = vi.fn();
const mockMutate = vi.fn();
const mockMutationState = {
  isPending: false,
  error: undefined as Error | undefined,
};

vi.mock('../../hooks', () => ({
  useLoginMutation: () => ({
    mutate: mockMutate,
    error: mockMutationState.error,
    isPending: mockMutationState.isPending,
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
    mockMutationState.error = undefined;
  });

  const renderForm = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>,
    );
  };

  const fillAndSubmitForm = async (
    user: ReturnType<typeof userEvent.setup>,
  ) => {
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);
  };

  it('validates required fields', async () => {
    renderForm();
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    await waitFor(() => {
      const emailError = screen.getByText(/invalid email address/i);
      const passwordError = screen.getByText(/password is required/i);
      expect(emailError).toBeInTheDocument();
      expect(passwordError).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    renderForm();
    const user = userEvent.setup();

    // Enter invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    await waitFor(() => {
      const emailError = screen.getByText(/invalid email address/i);
      expect(emailError).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderForm();
    const user = userEvent.setup();

    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'Password123',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });

  it('shows loading state during submission', async () => {
    mockMutationState.isPending = true;
    renderForm();

    await waitFor(() => {
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveTextContent(/signing in/i);
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls onSuccess after successful login', async () => {
    let onSuccessCallback: (() => void) | undefined;
    mockMutate.mockImplementationOnce(
      (_data: unknown, options: { onSuccess?: () => void }) => {
        onSuccessCallback = options.onSuccess;
      },
    );

    renderForm();
    const user = userEvent.setup();
    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    // Simulate successful login
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    mockMutationState.error = new Error('Invalid credentials');

    renderForm();
    const user = userEvent.setup();
    await fillAndSubmitForm(user);

    await waitFor(() => {
      const errorMessage = screen.getByText(/invalid credentials/i);
      expect(errorMessage).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows hover styles on form elements', async () => {
    renderForm();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button');

    await user.hover(emailInput);
    expect(emailInput).toHaveAttribute('data-hover');

    await user.hover(passwordInput);
    expect(passwordInput).toHaveAttribute('data-hover');

    await user.hover(submitButton);
    expect(submitButton).toHaveAttribute('data-hover');
  });
});
