import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/tests/test-utils';
import { userEvent } from '@testing-library/user-event';
import App from '@/App';
import { createTestHelpers } from '@/tests/setup';
import type { AuthResponse, JobDescriptionResponse } from '@/types/api';

const mockAuthResponse: AuthResponse = {
  access_token: 'test_token',
  refresh_token: 'test_refresh',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
};

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Test description',
  language_code: 'en',
  created_at: new Date().toISOString(),
  updated_at: null
};

function renderApp(route = '/') {
  return render(<App />, {
    route,
    authenticated: false // default to unauthenticated
  });
}

describe('App', () => {
  const { simulateSuccess, simulateError } = createTestHelpers();

  beforeEach(() => {
    localStorage.clear();
  });

  it('should redirect to login when accessing protected route without auth', () => {
    renderApp('/jobs');
    expect(window.location.pathname).toBe('/login');
  });

  it('should redirect to jobs after successful login', async () => {
    simulateSuccess('/api/v1/auth/login', 'post', mockAuthResponse);
    renderApp('/login');

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginButton);

    // Should redirect to jobs page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs');
    });
  });

  it('should show error message on login failure', async () => {
    simulateError('/api/v1/auth/login', 'post', 401, 'Invalid credentials');
    renderApp('/login');

    // Fill in login form with invalid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(loginButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Should stay on login page
    expect(window.location.pathname).toBe('/login');
  });

  it('should allow access to protected routes when authenticated', async () => {
    // Set up auth and jobs response
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    simulateSuccess('/api/v1/jobs', 'get', [mockJob]);

    render(<App />, {
      route: '/jobs',
      authenticated: true // explicitly set authenticated for protected routes
    });

    // Should stay on jobs page
    expect(window.location.pathname).toBe('/jobs');

    // Should render jobs content
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('should redirect to login after logout', async () => {
    // Set up auth and logout response
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    simulateSuccess('/api/v1/auth/logout', 'post', { message: 'Logged out successfully' });

    render(<App />, {
      route: '/jobs',
      authenticated: true
    });

    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    // Should redirect to login page
    expect(window.location.pathname).toBe('/login');

    // Should clear auth tokens
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('should redirect to login on token expiration', async () => {
    // Set up initial auth
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    // Set up expired token response
    simulateError('/api/v1/jobs', 'get', 401, 'Token expired');

    render(<App />, {
      route: '/jobs',
      authenticated: true
    });

    // Wait for redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('should handle refresh token flow', async () => {
    const newAuthResponse: AuthResponse = {
      ...mockAuthResponse,
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token'
    };

    // Set up refresh token success
    simulateSuccess('/api/v1/auth/refresh', 'post', newAuthResponse);
    // Set up successful jobs response after refresh
    simulateSuccess('/api/v1/jobs', 'get', [mockJob]);

    render(<App />, {
      route: '/jobs',
      authenticated: true
    });

    // Should automatically refresh token and retry request
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Should update tokens in storage
    expect(localStorage.getItem('access_token')).toBe('new_access_token');
    expect(localStorage.getItem('refresh_token')).toBe('new_refresh_token');
  });

  it('should handle failed refresh token attempt', async () => {
    // Set up failed refresh token
    simulateError(
      '/api/v1/auth/refresh',
      'post',
      401,
      'Invalid refresh token'
    );

    renderApp('/jobs');

    // Should redirect to login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });

    // Should clear tokens
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('should show 404 page for non-existent routes', () => {
    renderApp('/non-existent');
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
