import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobForm } from '../JobForm';
import { api } from '../../../../api';
import type { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '../../../../types/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the API
vi.mock('../../../../api', () => ({
  api: {
    jobs: {
      createJob: vi.fn(),
      updateJob: vi.fn(),
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

const mockCreateJob: JobDescriptionCreate = {
  title: 'New Job',
  description: 'Job Description',
  language_code: 'en',
};

const mockUpdateData = {
  title: 'Updated Job',
  description: 'Full stack developer position'
} as const;

const mockUpdateJob: JobDescriptionUpdate = {
  title: mockUpdateData.title,
  description: mockUpdateData.description,
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('JobForm', () => {
  const onSuccess = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Create Mode', () => {
    it('should render empty form in create mode', () => {
      renderWithRouter(<JobForm onSuccess={onSuccess} onError={onError} />);

      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.getByLabelText('Description')).toHaveValue('');
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByText('Create Job')).toBeInTheDocument();
    });

    it('should handle create job submission', async () => {
      (api.jobs.createJob as jest.Mock).mockResolvedValueOnce(mockJob);

      renderWithRouter(<JobForm onSuccess={onSuccess} onError={onError} />);

      await userEvent.type(screen.getByLabelText('Title'), mockCreateJob.title);
      await userEvent.type(screen.getByLabelText('Description'), mockCreateJob.description);
      await userEvent.selectOptions(screen.getByLabelText('Language'), mockCreateJob.language_code);

      fireEvent.submit(screen.getByRole('button', { name: 'Create Job' }));

      await waitFor(() => {
        expect(api.jobs.createJob).toHaveBeenCalledWith(mockCreateJob);
        expect(onSuccess).toHaveBeenCalledWith(mockJob);
      });
    });

    it('should handle create job error', async () => {
      const error = new Error('Failed to create job');
      (api.jobs.createJob as jest.Mock).mockRejectedValueOnce(error);

      renderWithRouter(<JobForm onSuccess={onSuccess} onError={onError} />);

      await userEvent.type(screen.getByLabelText('Title'), mockCreateJob.title);
      await userEvent.type(screen.getByLabelText('Description'), mockCreateJob.description);

      fireEvent.submit(screen.getByRole('button', { name: 'Create Job' }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to create job');
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render form with job data in edit mode', () => {
      renderWithRouter(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      expect(screen.getByLabelText('Title')).toHaveValue(mockJob.title);
      expect(screen.getByLabelText('Description')).toHaveValue(mockJob.description);
      expect(screen.queryByLabelText('Language')).not.toBeInTheDocument();
      expect(screen.getByText('Update Job')).toBeInTheDocument();
    });

    it('should handle update job submission', async () => {
      const updatedJob = { ...mockJob, ...mockUpdateData };
      (api.jobs.updateJob as jest.Mock).mockResolvedValueOnce(updatedJob);

      renderWithRouter(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      const titleInput = screen.getByLabelText('Title');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, mockUpdateData.title);

      fireEvent.submit(screen.getByRole('button', { name: 'Update Job' }));

      await waitFor(() => {
        expect(api.jobs.updateJob).toHaveBeenCalledWith(mockJob.id, mockUpdateJob);
        expect(onSuccess).toHaveBeenCalledWith(updatedJob);
      });
    });

    it('should handle empty values in update', async () => {
      const emptyUpdateJob: JobDescriptionUpdate = {
        title: undefined,
        description: undefined,
      };

      renderWithRouter(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      const titleInput = screen.getByLabelText('Title');
      const descInput = screen.getByLabelText('Description');
      await userEvent.clear(titleInput);
      await userEvent.clear(descInput);

      fireEvent.submit(screen.getByRole('button', { name: 'Update Job' }));

      await waitFor(() => {
        expect(api.jobs.updateJob).toHaveBeenCalledWith(mockJob.id, emptyUpdateJob);
      });
    });

    it('should handle update job error', async () => {
      const error = new Error('Failed to update job');
      (api.jobs.updateJob as jest.Mock).mockRejectedValueOnce(error);

      renderWithRouter(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      const titleInput = screen.getByLabelText('Title');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, mockUpdateData.title);
      fireEvent.submit(screen.getByRole('button', { name: 'Update Job' }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to update job');
      });
    });
  });

  it('should disable submit button while submitting', async () => {
    (api.jobs.createJob as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderWithRouter(<JobForm onSuccess={onSuccess} onError={onError} />);

    await userEvent.type(screen.getByLabelText('Title'), mockCreateJob.title);
    await userEvent.type(screen.getByLabelText('Description'), mockCreateJob.description);

    fireEvent.submit(screen.getByRole('button', { name: 'Create Job' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('should have a cancel button that links back to jobs list', () => {
    renderWithRouter(<JobForm onSuccess={onSuccess} onError={onError} />);
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/jobs');
  });
});
