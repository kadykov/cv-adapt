import { vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../../../lib/test/test-utils';
import { JobList } from '../JobList';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';

describe('JobList', () => {
  it('shows loading state initially', () => {
    render(<JobList />);
    expect(screen.getByRole('status')).toHaveClass('loading');
  });

  it('displays English jobs initially', async () => {
    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Should not show French job initially
    expect(screen.queryByText('Développeur Frontend')).not.toBeInTheDocument();
  });

  it('filters jobs by language', async () => {
    render(<JobList />);

    // Initially shows English job and language dropdown
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Switch to French
    fireEvent.click(screen.getByRole('button', { name: /english/i }));
    fireEvent.click(screen.getByText('French'));

    await waitFor(() => {
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.getByText('Développeur Frontend')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/v1/api/jobs', () => {
        return HttpResponse.error();
      })
    );

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load jobs/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no jobs available', async () => {
    server.use(
      http.get('/v1/api/jobs', () => {
        return HttpResponse.json([]);
      })
    );

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
    });
  });

  it('calls onJobSelect when a job is clicked', async () => {
    const handleSelect = vi.fn();
    render(<JobList onJobSelect={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Frontend Developer'));
    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
