import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobList } from '../JobList';
import { api } from '../../../../api';
import type { JobDescriptionResponse } from '../../../../types/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the API
vi.mock('../../../../api', () => ({
  api: {
    jobs: {
      getJobs: vi.fn(),
      deleteJob: vi.fn(),
    },
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

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('JobList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state initially', () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce([]);
    renderWithRouter(<JobList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render jobs when loaded successfully', async () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    renderWithRouter(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });
  });

  it('should show error message when loading fails', async () => {
    (api.jobs.getJobs as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
    renderWithRouter(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show empty state when no jobs exist', async () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce([]);
    renderWithRouter(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('No job descriptions found')).toBeInTheDocument();
      expect(screen.getByText('Add Job Description')).toBeInTheDocument();
    });
  });

  it('should delete a job when delete button is clicked', async () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    (api.jobs.deleteJob as jest.Mock).mockResolvedValueOnce(undefined);

    renderWithRouter(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const deleteButtons = await screen.findAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(api.jobs.deleteJob).toHaveBeenCalledWith(1);

    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  it('should render job links correctly', async () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    renderWithRouter(<JobList />);

    await waitFor(() => {
      const jobLink = screen.getByText('Software Engineer');
      expect(jobLink).toHaveAttribute('href', '/jobs/1');
    });
  });

  it('should render edit links correctly', async () => {
    (api.jobs.getJobs as jest.Mock).mockResolvedValueOnce(mockJobs);
    renderWithRouter(<JobList />);

    await waitFor(() => {
      const editLinks = screen.getAllByText('Edit');
      expect(editLinks[0]).toHaveAttribute('href', '/jobs/1/edit');
    });
  });
});
