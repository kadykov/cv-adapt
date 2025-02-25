import { describe, expect, it, beforeEach } from 'vitest';
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
  beforeEach(() => {
    localStorage.clear();
    server.use(
      // Override /users/me endpoint with a delayed response
      http.get('http://localhost:3000/users/me', async ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new HttpResponse(null, { status: 401 });
        }

        await delay(2000); // 2-second delay

        return HttpResponse.json({
          id: 1,
          email: 'test@example.com',
          created_at: '2024-02-23T10:00:00Z',
          personal_info: null,
        });
      }),
      ...authIntegrationHandlers.filter(
        (h) => h.info.path !== 'http://localhost:3000/users/me',
      ),
    );
  });

  it('should update header immediately after login, before token validation completes', async () => {
    render(
      <ProvidersWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="auth" element={<LoginForm onSuccess={() => {}} />} />
          </Route>
        </Routes>
      </ProvidersWrapper>,
    );

    // Navigate to auth page
    await userEvent.click(screen.getByText(/login/i));

    // Fill in form and submit
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify header updates immediately after login, before validation completes
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

  afterEach(() => {
    server.resetHandlers();
  });
});
