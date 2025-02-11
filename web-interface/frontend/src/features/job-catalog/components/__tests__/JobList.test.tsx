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
    renderJobList();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.description)).toBeInTheDocument();
    expect(screen.getByText(`Language: ${mockJob.language_code}`)).toBeInTheDocument();
  });

  test('displays empty state when no jobs', async () => {
    // Override handler to return empty array
    // Override handler to return empty array
    server.use(
      http.get('*/jobs', ({ request }) => {
        const url = new URL(request.url);
        url.searchParams.set('empty', 'true');
        return HttpResponse.json([]);
      })
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toHaveTextContent('No job descriptions found');
    });
    expect(screen.getByText('Add Job Description')).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    // Override handler to return error
    // Override handler to return error
    server.use(
      http.get('*/jobs', ({ request }) => {
        const url = new URL(request.url);
        url.searchParams.set('error', 'true');
        return HttpResponse.json(
          { message: 'Failed to load' },
          { status: 500 }
        );
      })
    );

    renderJobList();

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Failed to load');
    });
  });

  test('handles job deletion', async () => {
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
    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    });

    // Override delete handler to return error
    server.use(
      http.delete('*/jobs/:id', ({ request }) => {
        const url = new URL(request.url);
        url.searchParams.set('error', 'true');
        return new HttpResponse(null, { status: 500 });
      })
    );

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Failed to delete job. Please try again later.');
    });
  });
});
