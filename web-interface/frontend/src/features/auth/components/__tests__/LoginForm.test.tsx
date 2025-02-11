import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { LoginForm } from '../LoginForm';
import { AuthContext } from '../../context/AuthContext';
import { AuthResponse } from '../../../../validation/openapi';
import { ApiError } from '../../../../api/core/api-error';

// Mock cookies dynamic import
vi.mock('js-cookie', () => {
  const mockCookieStore: { [key: string]: string } = {};
  return {
    default: {
      get: vi.fn((name: string) => mockCookieStore[name]),
      set: vi.fn((name: string, value: string, _options?: object) => {
        mockCookieStore[name] = value;
      }),
      remove: vi.fn((name: string) => {
        delete mockCookieStore[name];
      }),
    },
  };
});

// Import Cookies after mocking
import Cookies from 'js-cookie';

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

const cookieOptions = {
  secure: false,
  sameSite: 'lax' as const,
  path: '/'
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  const mockLogin = vi.fn().mockImplementation(async () => {
    await act(async () => {
      Cookies.set('auth_token', mockAuthResponse.access_token, cookieOptions);
      Cookies.set('auth_user', JSON.stringify(mockAuthResponse.user), cookieOptions);
      Cookies.set('refresh_token', mockAuthResponse.refresh_token, cookieOptions);
    });
    return mockAuthResponse;
  });

  const renderWithAuth = () => {
    const utils = render(
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
        <LoginForm />
      </AuthContext.Provider>
    );
    return utils;
  };

  it('handles successful login and redirects to /jobs', async () => {
    renderWithAuth();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', false);
      expect(window.location.href).toBe('/jobs');
      expect(Cookies.set).toHaveBeenCalledWith('auth_token', mockAuthResponse.access_token, cookieOptions);
      expect(Cookies.set).toHaveBeenCalledWith('auth_user', JSON.stringify(mockAuthResponse.user), cookieOptions);
      expect(Cookies.set).toHaveBeenCalledWith('refresh_token', mockAuthResponse.refresh_token, cookieOptions);
    });
  });

  it('handles server error response', async () => {
    const mockErrorLogin = vi.fn().mockRejectedValue(
      new ApiError('Invalid email or password', 401)
    );

    render(
      <AuthContext.Provider
        value={{
          login: mockErrorLogin,
          logout: vi.fn(),
          register: vi.fn(),
          refreshToken: vi.fn(),
          token: null,
          user: null,
          isLoading: false,
          isAuthenticated: false
        }}
      >
        <LoginForm />
      </AuthContext.Provider>
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      expect(Cookies.set).not.toHaveBeenCalled();
    });
  });

  it('displays validation errors for empty form submission', async () => {
    renderWithAuth();

    await act(async () => {
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toHaveTextContent('Please enter a valid email address');
      expect(alerts[1]).toHaveTextContent('Password must be at least 8 characters');
    });
  });

  it('displays validation error for invalid email', async () => {
    renderWithAuth();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalidemail' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.submit(screen.getByRole('form'));
    });

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  // Cleanup
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });
});
