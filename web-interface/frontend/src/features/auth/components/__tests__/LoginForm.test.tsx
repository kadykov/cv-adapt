/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from '../LoginForm';
import { createTestQueryClient } from '../../testing/setup';
import { mockAuthResponse } from '../../testing/mocks';
import { ApiError } from '../../../../lib/api/client';
import '@testing-library/jest-dom';

// Test mocks
const mockOnSuccess = vi.fn();
let mockMutate = vi.fn();
let mockIsPending = false;
let mockError: Error | null = null;

// Mock the hooks
vi.mock('../../hooks', () => ({
  useLoginMutation: () => ({
    mutate: mockMutate,
    error: mockError,
    isPending: mockIsPending,
    isError: !!mockError,
    isSuccess: false,
    data: null,
  }),
}));

describe('LoginForm', () => {
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
        <LoginForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>,
    );
  };

  const fillAndSubmitForm = async (
    user: ReturnType<typeof userEvent.setup>,
  ) => {
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'Password123');
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
  };

  it('validates required fields', async () => {
    renderForm();
    const user = userEvent.setup();
    const submitButton = screen.getByTestId('submit-button');
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
    await user.type(screen.getByTestId('email-input'), 'invalid-email');
    await user.type(screen.getByTestId('password-input'), 'Password123');
    const submitButton = screen.getByTestId('submit-button');
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
        { onSuccess: mockOnSuccess },
      );
    });
  });

  it('shows loading state during submission', async () => {
    mockIsPending = true;
    renderForm();

    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent(/signing in/i);
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls onSuccess after successful login', async () => {
    mockMutate.mockImplementation(
      (
        _: { email: string; password: string },
        options?: { onSuccess?: (data: unknown) => void },
      ) => {
        if (options?.onSuccess) {
          options.onSuccess(mockAuthResponse);
        }
      },
    );

    renderForm();
    const user = userEvent.setup();
    await fillAndSubmitForm(user);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ onSuccess: mockOnSuccess }),
      );
    });
  });

  it('handles login error', async () => {
    mockError = new ApiError('Invalid credentials', 401);
    renderForm();
    const user = userEvent.setup();
    await fillAndSubmitForm(user);

    await waitFor(() => {
      const errorMessage = screen.getByText(/invalid credentials/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-error');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows interactive states on inputs', async () => {
    renderForm();
    const user = userEvent.setup();

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');

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

    await user.click(submitButton);
    expect(submitButton).toHaveAttribute(
      'data-headlessui-state',
      expect.stringContaining('hover'),
    );
  });
});
