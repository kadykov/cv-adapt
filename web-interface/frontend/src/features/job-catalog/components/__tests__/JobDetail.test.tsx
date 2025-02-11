import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobDetail } from '../JobDetail';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { mockJob } from '@/mocks/job-mock-data';

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
  test('shows loading state initially', () => {
    renderJobDetail();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays job details when loaded successfully', async () => {
    renderJobDetail('1');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();

    // Check dates are formatted
    expect(screen.getByText(`Created: ${new Date(mockJob.created_at).toLocaleDateString()}`)).toBeInTheDocument();
    if (mockJob.updated_at) {
      expect(screen.getByText(`Updated: ${new Date(mockJob.updated_at).toLocaleDateString()}`)).toBeInTheDocument();
    }
  });

  test('displays error message on fetch failure', async () => {
    // Override handler to return error
    server.use(
      http.get('*/jobs/:id', () => {
        return HttpResponse.json(
          { message: 'Failed to load job details' },
          { status: 500 }
        );
      })
    );

    renderJobDetail('1');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details')).toBeInTheDocument();
    });
  });

  test('displays not found message for non-existent job', async () => {
    // Override handler to return 404
    server.use(
      http.get('*/jobs/:id', () => {
        return HttpResponse.json(
          { message: 'Job not found' },
          { status: 404 }
        );
      })
    );

    renderJobDetail('999');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Job not found')).toBeInTheDocument();
  });

  test('handles invalid job ID', async () => {
    renderJobDetail('invalid-id');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load job details')).toBeInTheDocument();
  });
});
