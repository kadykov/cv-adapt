import { describe, test, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JobList } from '../JobList';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../mocks/server';
import { mockJob } from '../../../../mocks/job-mock-data';

function renderJobList() {
  return render(
    <BrowserRouter>
      <JobList />
    </BrowserRouter>
  );
}

describe('JobList', () => {
  test('shows loading state initially', () => {
    renderJobList();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays jobs when loaded successfully', async () => {
    server.use(
      http.get('*/jobs', () => HttpResponse.json([mockJob]))
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();
  });

  test('displays empty state when no jobs', async () => {
    server.use(
      http.get('*/jobs', () => HttpResponse.json([]))
    );

    renderJobList();

    // First wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /loading jobs/i })).not.toBeInTheDocument();
    });

    // Then check for empty state
    const emptyMessage = screen.getByTestId('empty-message');
    expect(emptyMessage).toHaveTextContent('No job descriptions found');
    expect(screen.getByText('Add Job Description')).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    server.use(
      http.get('*/jobs', () => HttpResponse.json(
        { message: 'Failed to load' },
        { status: 500 }
      ))
    );

    renderJobList();

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Failed to load');
    });
  });

  test('handles job deletion', async () => {
    server.use(
      http.get('*/jobs', () => HttpResponse.json([mockJob])),
      http.delete('*/jobs/:id', () => new HttpResponse(null, { status: 204 }))
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.queryByText(mockJob.title)).not.toBeInTheDocument();
    });
  });

  test('shows error on deletion failure', async () => {
    server.use(
      http.get('*/jobs', () => HttpResponse.json([mockJob])),
      http.delete('*/jobs/:id', () => new HttpResponse(null, { status: 500 }))
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Failed to delete job. Please try again later.');
    });
  });
});
