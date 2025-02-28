import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../testing/integration-handlers';
import { Layout } from '../../../../routes/Layout';
import { LoginForm } from '../../components/LoginForm';

const TestApp = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route path="auth" element={<LoginForm onSuccess={() => {}} />} />
    </Route>
  </Routes>
);

describe('Layout Authentication Integration', () => {
  beforeEach(() => {
    server.use(...authIntegrationHandlers);
    localStorage.clear();
  });

  it('should show login button when not authenticated', async () => {
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });
  });

  it('should update navigation after successful login', async () => {
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Initial state - only Login button visible
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();

    // Navigate to auth page
    await userEvent.click(screen.getByText(/login/i));

    // Fill in and submit login form (wait for form to be rendered)
    await waitFor(async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Verify navigation updates immediately after login
    expect(await screen.findByText(/logout/i)).toBeInTheDocument();
    expect(await screen.findByText(/jobs/i)).toBeInTheDocument();
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();

    // Verify token is stored
    expect(localStorage.getItem('access_token')).toBeTruthy();

    // Verify the header update was immediate and not delayed
    const spyConsoleError = vi.spyOn(console, 'error');

    // Wait for background token validation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensure header content hasn't changed
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
    expect(screen.getByText(/jobs/i)).toBeInTheDocument();
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();

    // Verify no errors during background validation
    expect(spyConsoleError).not.toHaveBeenCalled();
    spyConsoleError.mockRestore();
  });

  it('should update navigation after logout', async () => {
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    // Navigate to auth page and login
    await waitFor(async () => {
      await userEvent.click(screen.getByText(/login/i));
    });

    // Fill in and submit login form (wait for form to be rendered)
    await waitFor(async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Wait for authenticated state
    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    // Click logout button
    await userEvent.click(screen.getByText(/logout/i));

    // Verify navigation updates
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });

    // Verify token is removed
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
