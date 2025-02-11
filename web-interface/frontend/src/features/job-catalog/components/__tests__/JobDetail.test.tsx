import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobDetail } from '../JobDetail';
import { http } from 'msw';
import { server } from '@/mocks/server';
import { mockJob } from '@/mocks/job-mock-data';
import { validateResponse, jobSchema } from '@/tests/utils/contract-validation';

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
    const mockResponse = new Response(JSON.stringify(mockJob), {
      headers: { 'Content-Type': 'application/json' }
    });

    // Validate response matches contract
    await validateResponse(mockResponse, '/jobs/1', 'GET', 200, jobSchema);

    renderJobDetail('1');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();
    expect(screen.getByText(`Created: ${new Date(mockJob.created_at).toLocaleDateString()}`)).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    const errorResponse = new Response(
      JSON.stringify({ message: 'Failed to load job details' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    server.use(
      http.get('*/jobs/:id', () => errorResponse)
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
    const notFoundResponse = new Response(
      JSON.stringify({ message: 'Job not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    server.use(
      http.get('*/jobs/:id', () => notFoundResponse)
    );

    renderJobDetail('999');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Job not found')).toBeInTheDocument();
  });

  test('handles invalid job ID', async () => {
    server.use(
      http.get('*/jobs/:id', () => new Response(
        JSON.stringify({ message: 'Failed to load job details' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      ))
    );

    renderJobDetail('invalid-id');

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load job details', { exact: true })).toBeInTheDocument();
    });
  });
});
