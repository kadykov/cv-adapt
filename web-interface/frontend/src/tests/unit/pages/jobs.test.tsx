import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/tests/test-utils';
import Jobs from '@/pages/jobs';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionResponse } from '@/types/api';

const mockJobs: JobDescriptionResponse[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Test description',
    language_code: 'en',
    created_at: new Date().toISOString(),
    updated_at: null
  },
  {
    id: 2,
    title: 'Développeur Frontend',
    description: 'Description test',
    language_code: 'fr',
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

describe('Jobs Page', () => {
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

  beforeEach(() => {
    localStorage.clear();
  });

  it('should redirect to login if not authenticated', () => {
    render(<Jobs />);
    expect(window.location.pathname).toBe('/login');
  });

  it('should redirect to login on 401 response', async () => {
    simulateError('/api/v1/jobs', 'get', 401, 'Unauthorized');

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('should render jobs list for authenticated user', async () => {
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText(/en/i)).toBeInTheDocument();
  });

  it('should handle empty jobs list', async () => {
    simulateSuccess('/api/v1/jobs', 'get', []);

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    simulateLoading('/api/v1/jobs', 'get', 1000);

    render(<Jobs />, { authenticated: true });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Set up success response after loading
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    simulateError('/api/v1/jobs', 'get', 0, 'Network Error');

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should handle server error', async () => {
    simulateError('/api/v1/jobs', 'get', 500, 'Failed to fetch jobs');

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch jobs')).toBeInTheDocument();
    });
  });

  it('should filter jobs by language', async () => {
    simulateSuccess('/api/v1/jobs', 'get', mockJobs);

    render(<Jobs />, { authenticated: true });

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    });

    // Select French language
    const select = screen.getByLabelText(/language/i);
    await userEvent.selectOptions(select, 'fr');

    // Check filtered results
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();

    // Select all languages
    await userEvent.selectOptions(select, 'all');

    // Check all jobs are shown
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
  });

  it('should handle job deletion with server error', async () => {
    // Set up initial jobs list
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);
    // Set up deletion error
    simulateError('/api/v1/jobs/1', 'delete', 500, 'Failed to delete job');

    render(<Jobs />, { authenticated: true });

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Failed to delete job')).toBeInTheDocument();
    });

    // Check job still exists
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should handle successful job deletion', async () => {
    // Set up initial jobs list
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);
    // Set up successful deletion
    simulateSuccess('/api/v1/jobs/1', 'delete', null);
    // Set up empty list after deletion
    simulateSuccess('/api/v1/jobs', 'get', []);

    render(<Jobs />, { authenticated: true });

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);

    // Check success message and job removal
    await waitFor(() => {
      expect(screen.getByText('Job deleted successfully')).toBeInTheDocument();
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('should handle job deletion cancellation', async () => {
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);

    render(<Jobs />, { authenticated: true });

    // Wait for jobs to load
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Check that job remains and dialog is closed
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should navigate to job details page', async () => {
    simulateSuccess('/api/v1/jobs', 'get', [mockJobs[0]]);

    render(<Jobs />, { authenticated: true });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    await userEvent.click(viewDetailsButton);

    expect(window.location.pathname).toBe('/jobs/1');
  });

  it('should navigate to create job page', async () => {
    simulateSuccess('/api/v1/jobs', 'get', []);

    render(<Jobs />, { authenticated: true });

    const createButton = screen.getByRole('button', { name: /create new job/i });
    await userEvent.click(createButton);

    expect(window.location.pathname).toBe('/jobs/create');
  });
});
