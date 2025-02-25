import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ProvidersWrapper } from '../../../../test/setup/providers';
import { server } from '../../../../lib/test/integration/server';
import { authIntegrationHandlers } from '../../../auth/testing/integration-handlers';
import { tokenService } from '../../../auth/services/token-service';
import { JobList } from '../../components/JobList';
import { LoginForm } from '../../../auth/components/LoginForm';
import { http, HttpResponse } from 'msw';
import type { JobsResponse } from '../../../../lib/api/generated-types';

// Mock job data
const mockJobs: JobsResponse = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Full stack developer position',
    language_code: 'en',
    created_at: '2024-02-24T12:00:00Z',
    updated_at: '2024-02-24T12:00:00Z',
  },
];

const unauthorizedError = {
  detail: { message: 'Unauthorized - Invalid or missing token' },
};

const jobsHandlers = [
  // Return mockJobs with 401 if no auth token
  http.get('http://localhost:3000/jobs', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(unauthorizedError, { status: 401 });
    }
    return HttpResponse.json(mockJobs);
  }),
];

const TestApp = () => (
  <Routes>
    <Route path="/" element={<JobList />} />
    <Route path="/auth" element={<LoginForm onSuccess={() => {}} />} />
    <Route path="/jobs" element={<JobList />} />
  </Routes>
);

describe('Jobs with Authentication Integration', () => {
  beforeEach(() => {
    server.use(...authIntegrationHandlers, ...jobsHandlers);
    localStorage.clear();
  });

  it('should fetch and display jobs when authenticated', async () => {
    // Setup auth token
    tokenService.storeTokens({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'test@example.com',
        created_at: '2024-02-24T12:00:00Z',
        personal_info: null,
      },
    });

    // Set initial path before rendering
    window.history.pushState({}, '', '/jobs');
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Initially shows loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Then shows job data
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(
        screen.getByText('Full stack developer position'),
      ).toBeInTheDocument();
    });
  });

  it('should show error state when accessing jobs without auth token', async () => {
    // Set initial path before rendering
    window.history.pushState({}, '', '/jobs');
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Initially shows loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Should show error state due to 401
    await waitFor(() => {
      expect(
        screen.getByText(unauthorizedError.detail.message),
      ).toBeInTheDocument();
    });
  });

  it('should handle complete auth and jobs flow', async () => {
    // Set initial path before rendering
    window.history.pushState({}, '', '/auth');
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );

    // Fill in and submit login form
    await waitFor(async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Verify token was stored
    expect(localStorage.getItem('access_token')).toBeTruthy();

    // Navigate to jobs and verify they load
    // Set initial path before rendering
    window.history.pushState({}, '', '/jobs');
    render(
      <ProvidersWrapper>
        <TestApp />
      </ProvidersWrapper>,
    );
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(
        screen.getByText('Full stack developer position'),
      ).toBeInTheDocument();
    });
  });
});
