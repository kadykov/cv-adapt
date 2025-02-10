import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { LoginForm } from '../LoginForm';
import { AuthContext } from '../../context/AuthContext';
import { AuthResponse } from '../../../../validation/openapi';
import { ApiError } from '../../../../api/core/api-error';

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

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAuth = (mockLogin = vi.fn().mockResolvedValue(mockAuthResponse)) => {
    const AuthProviderWrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider
        value={{
          login: mockLogin,
          logout: vi.fn(),
          register: vi.fn(),
          refreshToken: vi.fn(),
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false
        }}
      >
        {children}
      </AuthContext.Provider>
    );

    return render(
      <BrowserRouter>
        <AuthProviderWrapper>
          <LoginForm />
        </AuthProviderWrapper>
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderWithAuth();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty form submission', async () => {
    renderWithAuth();

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent('Please enter a valid email address');
      expect(alerts[1]).toHaveTextContent('Password must be at least 8 characters');
    });
  });

  it('displays validation error for invalid email', async () => {
    renderWithAuth();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalidemail' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Please enter a valid email address');
    });
  });

  it('handles successful login and redirects to /jobs', async () => {
    const mockLogin = vi.fn().mockResolvedValue(mockAuthResponse);
    renderWithAuth(mockLogin);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Wait for the login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', false);
    });

    // Check that the form is no longer visible after successful login
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('handles server error response', async () => {
    const mockError = new ApiError('Invalid email or password', 401);
    const mockLogin = vi.fn().mockRejectedValue(mockError);

    renderWithAuth(mockLogin);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Invalid email or password');
  });
});
