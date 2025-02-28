import { vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../../../lib/test/test-utils';
import { JobList } from '../JobList';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../lib/test/server';
import { getTestApiUrl } from '../../../../lib/test/url-helper';
import {
  setTestAuthToken,
  clearTestAuthToken,
} from '../../../../lib/test/test-utils-auth';
import type { JobDescriptionResponse } from '../../../../lib/api/generated-types';

const mockJobs: JobDescriptionResponse[] = [
  {
    id: 1,
    title: 'Frontend Developer',
    description: 'Frontend development role',
    language_code: 'en',
    created_at: '2024-02-17T22:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    title: 'Développeur Frontend',
    description: "Création d'interfaces",
    language_code: 'fr',
    created_at: '2024-02-17T22:00:00Z',
    updated_at: null,
  },
];

const unauthorizedError = {
  detail: { message: 'Unauthorized - Invalid or missing token' },
};

describe('JobList', () => {
  beforeEach(() => {
    clearTestAuthToken();

    // Default handler for jobs endpoint
    server.use(
      http.get(getTestApiUrl('/jobs'), ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return HttpResponse.json(unauthorizedError, {
            status: 401,
          });
        }

        const url = new URL(request.url);
        const langCode = url.searchParams.get('language_code');
        const filteredJobs = langCode
          ? mockJobs.filter((job) => job.language_code === langCode)
          : mockJobs.filter((job) => job.language_code === 'en');

        return HttpResponse.json(filteredJobs);
      }),
    );
  });

  afterEach(() => {
    clearTestAuthToken();
  });

  it('shows loading state initially', () => {
    render(<JobList />);
    expect(screen.getByRole('status')).toHaveClass('loading');
  });

  it('displays English jobs initially', async () => {
    setTestAuthToken();
    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    // Should not show French job initially
    expect(screen.queryByText('Développeur Frontend')).not.toBeInTheDocument();
  });

  it('filters jobs by language', async () => {
    setTestAuthToken();
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
    setTestAuthToken();
    server.use(
      http.get(getTestApiUrl('/jobs'), () => {
        return HttpResponse.json(
          { detail: { message: 'Server error' } },
          { status: 500 },
        );
      }),
    );

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no jobs available', async () => {
    setTestAuthToken();
    server.use(
      http.get(getTestApiUrl('/jobs'), () => {
        return HttpResponse.json([]);
      }),
    );

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
    });
  });

  it('shows unauthorized state when auth token is missing', async () => {
    render(<JobList />);

    await waitFor(() => {
      expect(
        screen.getByText(unauthorizedError.detail.message),
      ).toBeInTheDocument();
    });
  });

  it('renders Add Job button with correct link', async () => {
    setTestAuthToken();
    render(<JobList />);

    await waitFor(() => {
      const addJobButton = screen.getByRole('link', { name: /add job/i });
      expect(addJobButton).toBeInTheDocument();
      expect(addJobButton).toHaveAttribute('href', '/jobs/new');
    });
  });

  it('calls onJobSelect when a job is clicked', async () => {
    setTestAuthToken();
    const handleSelect = vi.fn();
    render(<JobList onJobSelect={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Frontend Developer'));
    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
