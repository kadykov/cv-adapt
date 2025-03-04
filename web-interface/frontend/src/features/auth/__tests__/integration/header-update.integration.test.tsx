import { describe, expect, it, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { getTestApiUrl } from '../../../../lib/test/url-helper';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../testing/integration-handlers';
import { Layout } from '../../../../routes/Layout';
import { LoginForm } from '../../components/LoginForm';
import { http, HttpResponse, delay } from 'msw';

describe('Header Update Timing', () => {
  beforeAll(() => {
    // Reset route history before tests
    window.history.pushState({}, '', '/');
  });
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    created_at: '2024-02-23T10:00:00Z',
    personal_info: null,
  };

  beforeEach(() => {
    localStorage.clear();
    // Reset route history for each test
    window.history.pushState({}, '', '/');
    server.use(
      // Override /users/me endpoint with a delayed response
      http.get(getTestApiUrl('users/me'), async ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new HttpResponse(null, { status: 401 });
        }

        await delay(2000); // 2-second delay

        return HttpResponse.json(mockUser);
      }),
      ...authIntegrationHandlers.filter(
        (h) => h.info.path !== getTestApiUrl('users/me'),
      ),
    );
  });

  it('should update header and redirect after login success', async () => {
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

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

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

    // Verify we are redirected to home page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });

    // Wait for validation to complete and verify the header still shows authenticated state
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for the 2s delay plus buffer
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText(/logout/i)).toBeInTheDocument();
    expect(within(nav).getByText(/jobs/i)).toBeInTheDocument();
    expect(within(nav).queryByText(/login/i)).not.toBeInTheDocument();
  });

  it('should update auth state when logout is triggered and completed', async () => {
    // Set up initial authenticated state with token
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    server.use(
      http.get(getTestApiUrl('users/me'), ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer test-token')) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockUser);
      }),
    );

    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
            <Route path="auth" element={<div>Auth Page</div>} />
          </Route>
        </Routes>
      </ProvidersWrapper>,
    );

    // Wait for initial auth state to settle
    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Navigate to auth page before logout (this is what the Layout component will do)
    window.history.pushState({}, '', '/auth');

    // Click logout
    await user.click(screen.getByText(/logout/i));

    // Verify header updates and state is cleared
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });

    // Verify we stay on auth page
    expect(window.location.pathname).toBe('/auth');
  });

  it('should maintain logged out state even if logout API call fails', async () => {
    // Set up initial authenticated state with token and failed logout
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    server.use(
      http.get(getTestApiUrl('users/me'), ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer test-token')) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json(mockUser);
      }),
      http.post(getTestApiUrl('auth/logout'), async () => {
        await delay(1000);
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
            <Route path="auth" element={<div>Auth Page</div>} />
          </Route>
        </Routes>
      </ProvidersWrapper>,
    );

    // Wait for initial auth state to settle
    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Navigate to auth page before logout (this is what the Layout component will do)
    window.history.pushState({}, '', '/auth');

    // Click logout
    await user.click(screen.getByText(/logout/i));

    // Give the UI a chance to update after the logout action
    await waitFor(
      () => {
        const nav = screen.getByRole('navigation');
        expect(within(nav).getByText(/login/i)).toBeInTheDocument();
        expect(within(nav).queryByText(/logout/i)).not.toBeInTheDocument();
      },
      { timeout: 2000 }, // Increased timeout to account for API delay
    );

    // Verify we stay on auth page
    expect(window.location.pathname).toBe('/auth');

    // Wait for the failed API call to complete and verify UI state persists
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait longer than the API delay
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText(/login/i)).toBeInTheDocument();
    expect(within(nav).queryByText(/logout/i)).not.toBeInTheDocument();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
    window.history.replaceState({}, '', '/');
  });
});
