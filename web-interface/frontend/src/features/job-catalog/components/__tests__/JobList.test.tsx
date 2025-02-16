import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { JobList } from '../JobList';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionResponse } from '@/types/api';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Test description',
  language_code: 'en',
  created_at: new Date().toISOString(),
  updated_at: null
};

function renderJobList() {
  return render(
    <BrowserRouter>
      <JobList />
    </BrowserRouter>
  );
}

describe('JobList', () => {
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

  test('shows loading state initially', async () => {
    simulateLoading('/api/v1/jobs', 'get', 1000);
    renderJobList();

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('displays jobs when loaded successfully', async () => {
    simulateSuccess('/api/v1/jobs', 'get', [mockJob]);

    renderJobList();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();
  });

  test('displays empty state when no jobs', async () => {
    simulateSuccess('/api/v1/jobs', 'get', []);

    renderJobList();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('empty-message')).toHaveTextContent('No job descriptions found');
    expect(screen.getByText('Add Job Description')).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    simulateError('/api/v1/jobs', 'get', 500, 'Failed to load');

    renderJobList();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load');
  });

  test('handles job deletion', async () => {
    const user = userEvent.setup();

    // Setup initial state with a job
    simulateSuccess('/api/v1/jobs', 'get', [mockJob]);
    // Setup successful deletion
    simulateSuccess(`/api/v1/jobs/${mockJob.id}`, 'delete', null);
    // Setup empty state after deletion
    simulateSuccess('/api/v1/jobs', 'get', []);

    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.queryByText(mockJob.title)).not.toBeInTheDocument();
    });
  });

  test('shows error on deletion failure', async () => {
    const user = userEvent.setup();

    // Setup initial state with a job
    simulateSuccess('/api/v1/jobs', 'get', [mockJob]);
    // Setup failed deletion
    simulateError(
      `/api/v1/jobs/${mockJob.id}`,
      'delete',
      500,
      'Failed to delete job. Please try again later.'
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: mockJob.title })).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to delete job. Please try again later.'
      );
    });

    expect(screen.getByRole('link', { name: mockJob.title })).toBeInTheDocument();
  });
});
