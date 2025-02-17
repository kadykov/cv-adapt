import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '../../context';
import { useRegisterMutation } from '../../hooks';
import { createTestQueryClient, mockAuthResponse } from '../../testing';
import { ApiError } from '../../../../lib/api/client';

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
    if (data.email) {
      await user.type(screen.getByLabelText(/email/i), data.email);
    }
    if (data.password) {
      await user.type(screen.getByLabelText(/^password$/i), data.password);
    }
    if (data.confirmPassword) {
      await user.type(screen.getByLabelText(/confirm password/i), data.confirmPassword);
    }

    const submitButton = screen.getByRole('button', { name: /^create account$/i });
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
      const errorMessages = await screen.findAllByText((content) => {
        return [
          'Password must be at least 8 characters',
          'Password must contain at least one uppercase letter',
          'Password must contain at least one number',
        ].some((msg) => content.includes(msg));
      });
      expect(errorMessages).toHaveLength(3);
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
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
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
    });
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
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
