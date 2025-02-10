import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../../../api/core/api-error';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../context/AuthContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('RegisterForm', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ register: mockRegister });
  });

  const renderForm = () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );
  };

  const fillForm = (email = 'test@example.com', password = 'Password123!', acceptTerms = true) => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
    if (acceptTerms) {
      fireEvent.click(screen.getByLabelText(/terms and conditions/i));
    }
  };

  it('renders registration form elements', () => {
    renderForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('displays validation errors for invalid input', async () => {
    renderForm();
    fillForm('', '', false);
    const form = screen.getByRole('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(3);
      expect(alerts[0]).toHaveTextContent('Please enter a valid email address');
      expect(alerts[1]).toHaveTextContent('Password must contain at least 8 characters');
      expect(alerts[2]).toHaveTextContent('Please accept the terms and conditions');
    });
  });

  it('validates password requirements', async () => {
    renderForm();
    fillForm('test@example.com', 'short');
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password must contain at least 8 characters');
    });
  });

  it('requires terms acceptance', async () => {
    renderForm();
    fillForm('test@example.com', 'Password123!', false);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it('displays error message on registration failure', async () => {
    mockRegister.mockRejectedValueOnce(
      new ApiError('Email already exists', 409)
    );
    renderForm();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    mockRegister.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)));
    renderForm();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('calls register function with correct data', async () => {
    renderForm();
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';

    fillForm(testEmail, testPassword);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(testEmail, testPassword);
    });
  });
});
