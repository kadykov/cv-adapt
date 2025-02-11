import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import { AuthContext } from '../../context/AuthContext';
import { ApiError } from '../../../../api/core/api-error';
import type { AuthResponse } from '../../../../validation/openapi';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock window.location
const originalLocation = window.location;
const mockLocation = { ...originalLocation, href: '' };
Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
});

// Mock successful auth response
const mockAuthResponse: AuthResponse = {
  access_token: 'mock_token',
  refresh_token: 'mock_refresh',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    personal_info: null,
    created_at: new Date().toISOString().split('.')[0]
  }
};

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockRegister = vi.fn().mockResolvedValue(mockAuthResponse);

  const renderForm = () => {
    return render(
      <AuthContext.Provider
        value={{
          register: mockRegister,
          login: vi.fn(),
          logout: vi.fn(),
          refreshToken: vi.fn(),
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false
        }}
      >
        <RegisterForm />
      </AuthContext.Provider>
    );
  };

  const fillForm = (email = 'test@example.com', password = 'Password123!', acceptTerms = true) => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
    if (acceptTerms) {
      fireEvent.click(termsCheckbox);
    }
  };

  const submitForm = async () => {
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });
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
    await submitForm();

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
    fillForm('test@example.com', 'short', true);
    await submitForm();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Password must contain at least 8 characters');
    });
  });

  it('requires terms acceptance', async () => {
    renderForm();
    fillForm('test@example.com', 'Password123!', false);
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/please accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it('displays error message on registration failure', async () => {
    const mockErrorRegister = vi.fn().mockRejectedValue(
      new ApiError('Email already exists', 409)
    );

    render(
      <AuthContext.Provider
        value={{
          register: mockErrorRegister,
          login: vi.fn(),
          logout: vi.fn(),
          refreshToken: vi.fn(),
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false
        }}
      >
        <RegisterForm />
      </AuthContext.Provider>
    );

    fillForm();
    await submitForm();

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    const mockSlowRegister = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockAuthResponse), 100))
    );

    render(
      <AuthContext.Provider
        value={{
          register: mockSlowRegister,
          login: vi.fn(),
          logout: vi.fn(),
          refreshToken: vi.fn(),
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false
        }}
      >
        <RegisterForm />
      </AuthContext.Provider>
    );

    fillForm();
    await submitForm();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('handles successful registration', async () => {
    renderForm();
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';

    fillForm(testEmail, testPassword, true);
    await submitForm();

    await waitFor(() => {
      // Verify registration call
      expect(mockRegister).toHaveBeenCalledWith(testEmail, testPassword);
    });

    expect(window.location.href).toBe('/jobs');
  });

  // Cleanup
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });
});
