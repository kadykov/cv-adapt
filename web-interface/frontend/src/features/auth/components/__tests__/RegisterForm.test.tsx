import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '../../context';
import { useRegisterMutation } from '../../hooks';
import { createTestQueryClient, mockAuthResponse } from '../../testing';
import { ApiError } from '../../../../lib/api/client';
import '@testing-library/jest-dom';

// Mock hooks
vi.mock('../../hooks', () => ({
  useRegisterMutation: vi.fn(),
}));

vi.mock('../../context', () => ({
  useAuth: vi.fn(),
}));

const mockUseRegisterMutation = useRegisterMutation as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('RegisterForm', () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ login: mockLogin });
    mockUseRegisterMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });
  });

  const renderForm = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <RegisterForm onSuccess={mockOnSuccess} {...props} />
      </QueryClientProvider>
    );
  };

  const fillFormAndSubmit = async (user: ReturnType<typeof userEvent.setup>, data: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  }) => {
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

    // Test hover states
    await user.hover(emailInput);
    expect(emailInput).toHaveAttribute('data-hover');

    await user.hover(passwordInput);
    expect(passwordInput).toHaveAttribute('data-hover');

    await user.hover(confirmPasswordInput);
    expect(confirmPasswordInput).toHaveAttribute('data-hover');

    const submitButton = screen.getByRole('button', { name: /^create account$/i });
    await user.hover(submitButton);
    expect(submitButton).toHaveAttribute('data-hover');

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
    // Set up initial state
    mockUseRegisterMutation.mockReturnValue({
      mutateAsync: vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100))),
      isPending: false,
      error: null,
    });

    renderForm();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /^create account$/i });

    // Fill and submit form
    await fillFormAndSubmit(user, {
      email: 'test@example.com',
      password: 'ValidPass123',
      confirmPassword: 'ValidPass123',
    });

    // Now mock the loading state
    mockUseRegisterMutation.mockReturnValue({
      mutateAsync: vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100))),
      isPending: true,
      error: null,
    });

    // Wait for loading state
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/creating account/i);
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('data-disabled');
    });

    // Verify form fields are disabled during submission
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
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
    const error = new ApiError('Email already exists', 400);
    mockUseRegisterMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error,
    });

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

  it('shows focus state on inputs when focused', async () => {
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
