import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JobDetail } from '../JobDetail';
import { jobsApi } from '../../api/jobsApi';
import type { JobDescriptionResponse } from '../../../../types/api';

// Mock the jobsApi
vi.mock('../../api/jobsApi', () => ({
  jobsApi: {
    getJob: vi.fn(),
  },
}));

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Full stack developer position',
  language_code: 'en',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('JobDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state initially', () => {
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    render(<JobDetail jobId={1} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render job details when loaded', async () => {
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Full stack developer position')).toBeInTheDocument();
      expect(screen.getByText(/Language:/)).toHaveTextContent('Language: en');
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
      expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    });
  });

  it('should handle loading error', async () => {
    (jobsApi.getJob as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show not found message when job is null', async () => {
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(null);
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Job not found')).toBeInTheDocument();
    });
  });

  it('should render correct action buttons', async () => {
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      const backButton = screen.getByText('Back to List');

      expect(editButton).toHaveAttribute('href', '/jobs/1/edit');
      expect(backButton).toHaveAttribute('href', '/jobs');
    });
  });

  it('should format dates correctly', async () => {
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(mockJob);
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      const createdDate = new Date(mockJob.created_at).toLocaleDateString();
      const updatedDate = new Date(mockJob.updated_at!).toLocaleDateString();

      expect(screen.getByText(new RegExp(createdDate))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(updatedDate))).toBeInTheDocument();
    });
  });

  it('should handle job without update date', async () => {
    const jobWithoutUpdate = { ...mockJob, updated_at: null };
    (jobsApi.getJob as jest.Mock).mockResolvedValueOnce(jobWithoutUpdate);
    render(<JobDetail jobId={1} />);

    await waitFor(() => {
      expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
    });
  });
});
