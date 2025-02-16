import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import { createTestHelpers } from '@/tests/setup';
import type { AuthResponse } from '@/types/api';

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

function renderLayout(children: React.ReactNode = <div>Test Content</div>) {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>
  );
}

describe('Layout', () => {
  const { simulateSuccess } = createTestHelpers();

  it('renders children content', () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    renderLayout();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays user email when authenticated', () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    renderLayout();
    expect(screen.getByText(mockAuthResponse.user.email)).toBeInTheDocument();
  });

  it('handles logout click', async () => {
    // Setup auth success and logout success
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    simulateSuccess('/api/v1/auth/logout', 'post', { message: 'Logged out successfully' });

    renderLayout();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await userEvent.click(logoutButton);

    // Should redirect to login
    expect(window.location.pathname).toBe('/login');
  });

  it('renders navigation links', () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    renderLayout();

    expect(screen.getByRole('link', { name: /job board/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
  });

  it('renders footer with current year', () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    renderLayout();

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
  });

  it('applies correct styles to active navigation link', () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    window.history.pushState({}, 'Test page', '/jobs');

    renderLayout();

    const jobsLink = screen.getByRole('link', { name: /jobs/i });
    expect(jobsLink).toHaveClass('border-indigo-500');
  });

  it('handles navigation between pages', async () => {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
    renderLayout();

    const homeLink = screen.getByRole('link', { name: /job board/i });
    await userEvent.click(homeLink);

    expect(window.location.pathname).toBe('/');
  });

  it('shows loading state while checking auth', async () => {
    // Simulate a delayed auth response
    const { simulateLoading } = createTestHelpers();
    simulateLoading('/api/v1/auth/refresh', 'post', 1000);
    renderLayout();

    // Initially should show loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Set up success response after loading
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Should show content after loading
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
