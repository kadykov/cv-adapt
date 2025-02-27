/**
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from '../RegisterForm';
import { ApiError } from '../../../../lib/api/client';
import { createTestQueryClient } from '../../testing/setup';
import '@testing-library/jest-dom';

// These mocks must be defined before other imports
let mockMutate = vi.fn();
const mockOnSuccess = vi.fn();
let mockIsPending = false;
let mockError: Error | null = null;

vi.mock('../../hooks/index', () => ({
  useRegisterMutation: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    error: mockError,
    isError: !!mockError,
    isSuccess: false,
    data: null,
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockError = null;
    mockMutate = vi.fn();
  });

  const renderForm = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>,
    );
  };

  const fillFormAndSubmit = async (
    user: ReturnType<typeof userEvent.setup>,
    data: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    },
  ) => {
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');

    if (data.email) {
      await user.type(emailInput, data.email);
    }
    if (data.password) {
      await user.type(passwordInput, data.password);
    }
    if (data.confirmPassword) {
      await user.type(confirmPasswordInput, data.confirmPassword);
    }

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    return submitButton;
  };

  it('validates required fields', async () => {
    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {});

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('validates password length requirement', async () => {
    renderForm();
    const user = userEvent.setup();

    // Type in a short password and blur the field
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'weak');
    await user.tab();

    // Submit form to ensure validation triggers
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should show length validation error
    await waitFor(() => {
      expect(
        screen.getByText(/must be at least 8 characters/i),
      ).toBeInTheDocument();
    });
  });

  it('validates password uppercase requirement', async () => {
    renderForm();
    const user = userEvent.setup();

    // Type in password without uppercase and blur
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'password123');
    await user.tab();

    // Submit form to ensure validation triggers
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should show uppercase validation error
    await waitFor(() => {
      expect(
        screen.getByText(/must contain at least one uppercase letter/i),
      ).toBeInTheDocument();
    });
  });

  it('validates password number requirement', async () => {
    renderForm();
    const user = userEvent.setup();

    // Type in password without number and blur
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'Password');
    await user.tab();

    // Submit form to ensure validation triggers
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should show number validation error
    await waitFor(() => {
      expect(
        screen.getByText(/must contain at least one number/i),
      ).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'DifferentPass123',
    });

    await waitFor(() => {
      const errorMessage = screen.getByText(/passwords don't match/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-error');
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockIsPending = true;
    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
    });

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toHaveTextContent(/creating account\.\.\./i);
    expect(submitButton).toBeDisabled();

    // Verify form fields are disabled during submission
    expect(screen.getByTestId('email-input')).toBeDisabled();
    expect(screen.getByTestId('password-input')).toBeDisabled();
    expect(screen.getByTestId('confirm-password-input')).toBeDisabled();
  });

  it('handles successful registration', async () => {
    mockMutate.mockImplementation(
      (
        _: { email: string; password: string },
        options?: { onSuccess?: () => void },
      ) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      },
    );

    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });

    // The mock implementation should have triggered onSuccess
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('displays error message when registration fails', async () => {
    mockError = new ApiError('Email already exists', 400);
    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
    });

    await waitFor(() => {
      const errorMessage = screen.getByText(/email already exists/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-error');
    });
  });

  it('shows interactive states on inputs', async () => {
    renderForm();
    const user = userEvent.setup();

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');

    await user.click(emailInput);
    expect(emailInput).toHaveAttribute(
      'data-headlessui-state',
      expect.stringContaining('focus'),
    );

    await user.click(passwordInput);
    expect(passwordInput).toHaveAttribute(
      'data-headlessui-state',
      expect.stringContaining('focus'),
    );

    await user.click(confirmPasswordInput);
    expect(confirmPasswordInput).toHaveAttribute(
      'data-headlessui-state',
      expect.stringContaining('focus'),
    );
  });
});
