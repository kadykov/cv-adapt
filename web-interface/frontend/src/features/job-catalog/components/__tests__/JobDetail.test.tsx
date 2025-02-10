import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JobDetail } from '../JobDetail';
import { api } from '../../../../api';
import type { JobDescriptionResponse } from '../../../../types/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the API
vi.mock('../../../../api', () => ({
  api: {
    jobs: {
      getJob: vi.fn(),
    },
  },
}));

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Full stack developer position',
  language_code: 'en',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('JobDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state initially', () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    renderWithRouter(<JobDetail jobId={1} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render job details when loaded', async () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Full stack developer position')).toBeInTheDocument();
      expect(screen.getByText(/Language:/)).toHaveTextContent('Language: en');
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });
  });

  it('should handle loading error', async () => {
    (api.jobs.getJob as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show not found message when job is null', async () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(null);
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Job not found')).toBeInTheDocument();
    });
  });

  it('should render correct action buttons', async () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      const backButton = screen.getByText('Back to List');

      expect(editButton).toHaveAttribute('href', '/jobs/1/edit');
      expect(backButton).toHaveAttribute('href', '/jobs');
    });
  });

  it('should format dates correctly', async () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      const createdDate = new Date(mockJob.created_at).toLocaleDateString();
      expect(screen.getByText(new RegExp(createdDate))).toBeInTheDocument();
    });
  });

  it('should handle optional update date', async () => {
    (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    renderWithRouter(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
      const withUpdate = { ...mockJob, updated_at: '2024-01-02T00:00:00Z' };
      (api.jobs.getJob as jest.Mock).mockResolvedValueOnce(withUpdate);
    });
  });
});
