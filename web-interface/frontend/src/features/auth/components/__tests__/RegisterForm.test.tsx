/**
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockAuthContext, mockAuthContextValue } from '../../testing/setup';

// These mocks must be defined before any other imports
const mockMutateAsync = vi.fn();
const mockOnSuccess = vi.fn();
let mockIsLoading = false;
let mockError: Error | null = null;

// Mock auth context
vi.mock('../../auth-context', () => mockAuthContext);

// Mock hooks
vi.mock('../../hooks', () => ({
  useRegisterMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsLoading,
    error: mockError,
    isError: !!mockError,
    isSuccess: false,
    data: null,
  }),
}));

// Regular imports after mocks
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from '../RegisterForm';
import { createTestQueryClient } from '../../testing';
import { ApiError } from '../../../../lib/api/client';
import { mockAuthResponse } from '../../testing/fixtures';
import '@testing-library/jest-dom';

const mockLogin = mockAuthContextValue.login;

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockError = null;
  });

  const renderForm = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>,
    );
  };

  const getSubmitButton = () => {
    return screen.getByRole('button', {
      name: mockIsLoading ? /creating account\.\.\./i : /create account/i,
    });
  };

  const fillFormAndSubmit = async (
    user: ReturnType<typeof userEvent.setup>,
    data: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    },
  ) => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    if (data.email) {
      await user.type(emailInput, data.email);
    }
    if (data.password) {
      await user.type(passwordInput, data.password);
    }
    if (data.confirmPassword) {
      await user.type(confirmPasswordInput, data.confirmPassword);
    }

    const submitButton = getSubmitButton();
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

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('validates password complexity requirements', async () => {
    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    });

    // Wait for all error messages to appear
    await waitFor(async () => {
      const errorMessages = await screen.findAllByRole('alert');
      expect(errorMessages).toHaveLength(3);
      expect(errorMessages[0]).toHaveClass('text-error');
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
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

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockIsLoading = true;
    renderForm();
    const user = userEvent.setup();

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmPasswordInput, 'ValidPass123');

    // Get submit button and verify loading state
    const submitButton = getSubmitButton();
    expect(submitButton).toHaveTextContent(/creating account\.\.\./i);
    expect(submitButton).toBeDisabled();

    // Verify form fields are disabled during submission
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

  it('handles successful registration', async () => {
    mockMutateAsync.mockResolvedValue(mockAuthResponse);

    renderForm();
    const user = userEvent.setup();

    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockAuthResponse);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
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

  it('shows focus states', async () => {
    renderForm();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.click(emailInput);
    expect(emailInput).toHaveAttribute('data-focus');

    await user.click(passwordInput);
    expect(passwordInput).toHaveAttribute('data-focus');

    await user.click(confirmPasswordInput);
    expect(confirmPasswordInput).toHaveAttribute('data-focus');
  });
});
