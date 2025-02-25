import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../testing/integration-handlers';
import { Layout } from '../../../../routes/Layout';
import { LoginForm } from '../../components/LoginForm';
import { http, HttpResponse, delay } from 'msw';

describe('Header Update Timing', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    created_at: '2024-02-23T10:00:00Z',
    personal_info: null,
  };

  beforeEach(() => {
    localStorage.clear();
    // Reset event listeners between tests
    window.removeEventListener('auth-state-change', () => {});
    server.use(
      // Override /users/me endpoint with a delayed response
      http.get('http://localhost:3000/users/me', async ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new HttpResponse(null, { status: 401 });
        }

        await delay(2000); // 2-second delay

        return HttpResponse.json(mockUser);
      }),
      ...authIntegrationHandlers.filter(
        (h) => h.info.path !== 'http://localhost:3000/users/me',
      ),
    );
  });

  it('should update header immediately after login success response, before token validation completes', async () => {
    // Clear any existing tokens
    localStorage.clear();
    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="auth" element={<LoginForm onSuccess={() => {}} />} />
          </Route>
        </Routes>
      </ProvidersWrapper>,
    );

    const user = userEvent.setup();

    // Navigate to auth page
    await user.click(screen.getByText(/login/i));

    // Fill in form and submit
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verify header updates immediately after login API success, before validation completes
    await waitFor(
      () => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
        expect(screen.getByText(/jobs/i)).toBeInTheDocument();
        expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    ); // Header should update within 1 second

    // Wait for validation to complete and verify the header still shows authenticated state
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for the 2s delay plus buffer
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
    expect(screen.getByText(/jobs/i)).toBeInTheDocument();
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
  });

  it('should update header immediately when logout is triggered, before API response', async () => {
    // Set up initial authenticated state with tokens and mock user
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString()); // 1 hour from now

    // Mock /users/me endpoint for initial auth check
    server.use(
      http.get('http://localhost:3000/users/me', () => {
        return HttpResponse.json(mockUser);
      }),
    );

    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />} />
        </Routes>
      </ProvidersWrapper>,
    );

    // Wait for initial auth check to complete
    await waitFor(
      () => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
      },
      { timeout: 2000 }, // Increase timeout to ensure auth check completes
    );

    const user = userEvent.setup();

    // Set up API delay for logout
    server.use(
      http.post('http://localhost:3000/auth/logout', async () => {
        await delay(2000); // 2-second delay
        return new HttpResponse(null, { status: 200 });
      }),
    );

    // Click logout button
    await user.click(screen.getByText(/logout/i));

    // Verify header updates immediately, before API response
    await waitFor(
      () => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
      },
      { timeout: 500 }, // Header should update within 500ms
    );

    // Verify the header stays in logged out state after API response
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for API delay
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
  });

  it('should not revert header state if logout API call fails', async () => {
    // Set up initial authenticated state
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    // Mock /users/me endpoint for initial auth check
    server.use(
      http.get('http://localhost:3000/users/me', () => {
        return HttpResponse.json(mockUser);
      }),
    );

    // Mock logout to fail
    server.use(
      http.post('http://localhost:3000/auth/logout', async () => {
        await delay(1000);
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />} />
        </Routes>
      </ProvidersWrapper>,
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Click logout button
    await user.click(screen.getByText(/logout/i));

    // Verify header updates immediately
    await waitFor(
      () => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
      },
      { timeout: 500 },
    );

    // Verify the header stays in logged out state even after API failure
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });
});
