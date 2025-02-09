import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobList } from '../JobList';
import { jobsApi } from '../../api/jobsApi';
import type { JobDescriptionResponse } from '../../../../types/api';

// Mock the jobsApi
vi.mock('../../api/jobsApi', () => ({
  jobsApi: {
    getJobs: vi.fn(),
    deleteJob: vi.fn(),
  },
}));

const mockJobs: JobDescriptionResponse[] = [
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Full stack developer position',
    language_code: 'en',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: 2,
    title: 'Product Manager',
    description: 'Product management role',
    language_code: 'en',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: null,
  },
];

describe('JobList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state initially', () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce([]);
    render(<JobList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render jobs when loaded successfully', async () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });

  it('should show error message when loading fails', async () => {
    (jobsApi.getJobs as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show empty state when no jobs exist', async () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce([]);
    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('No job descriptions found')).toBeInTheDocument();
      expect(screen.getByText('Add Job Description')).toBeInTheDocument();
    });
  });

  it('should delete a job when delete button is clicked', async () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    (jobsApi.deleteJob as jest.Mock).mockResolvedValueOnce(undefined);

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const deleteButtons = await screen.findAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(jobsApi.deleteJob).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('should render job links correctly', async () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    render(<JobList />);

    await waitFor(() => {
      const jobLink = screen.getByText('Software Engineer');
      expect(jobLink).toHaveAttribute('href', '/jobs/1');
    });
  });

  it('should render edit links correctly', async () => {
    (jobsApi.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    render(<JobList />);

    await waitFor(() => {
      const editLinks = screen.getAllByText('Edit');
      expect(editLinks[0]).toHaveAttribute('href', '/jobs/1/edit');
    });
  });
});
