import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobDetail } from '../JobDetail';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionResponse } from '@/types/api';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Test description',
  language_code: 'en',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: null
};

function renderJobDetail(id: string = '1') {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${id}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('JobDetail', () => {
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();

  test('shows loading state initially', async () => {
    simulateLoading('/api/v1/jobs/1', 'get', 1000);
    renderJobDetail();

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  test('displays job details when loaded successfully', async () => {
    simulateSuccess('/api/v1/jobs/1', 'get', mockJob);

    renderJobDetail('1');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify all job details are displayed
    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();
    expect(screen.getByText(`Created: ${new Date(mockJob.created_at).toLocaleDateString()}`)).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    simulateError(
      '/api/v1/jobs/1',
      'get',
      500,
      'Failed to load job details'
    );

    renderJobDetail('1');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load job details')).toBeInTheDocument();
  });

  test('displays not found message for non-existent job', async () => {
    simulateError(
      '/api/v1/jobs/999',
      'get',
      404,
      'Job not found'
    );

    renderJobDetail('999');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Job not found')).toBeInTheDocument();
  });

  test('handles invalid job ID', async () => {
    simulateError(
      '/api/v1/jobs/invalid-id',
      'get',
      400,
      'Invalid job ID'
    );

    renderJobDetail('invalid-id');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Invalid job ID')).toBeInTheDocument();
  });

  test('displays all required job fields', async () => {
    const detailedJob: JobDescriptionResponse = {
      ...mockJob,
      title: 'Senior Software Engineer',
      description: 'Detailed job description\nWith multiple lines',
      language_code: 'en',
      created_at: '2025-01-01T12:00:00Z',
      updated_at: '2025-01-02T12:00:00Z'
    };

    simulateSuccess('/api/v1/jobs/1', 'get', detailedJob);

    renderJobDetail('1');

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify all required fields are present
    expect(screen.getByText(detailedJob.title)).toBeInTheDocument();
    expect(screen.getByText(detailedJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${detailedJob.language_code}`)).toBeInTheDocument();
    expect(screen.getByText(`Created: ${new Date(detailedJob.created_at).toLocaleDateString()}`)).toBeInTheDocument();

    // Check for optional updated date
    if (detailedJob.updated_at) {
      expect(screen.getByText(`Updated: ${new Date(detailedJob.updated_at).toLocaleDateString()}`)).toBeInTheDocument();
    }
  });
});
