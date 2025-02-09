import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobForm } from '../JobForm';
import { jobsApi } from '../../api/jobsApi';
import type { JobDescriptionResponse } from '../../../../types/api';

// Mock the jobsApi
vi.mock('../../api/jobsApi', () => ({
  jobsApi: {
    createJob: vi.fn(),
    updateJob: vi.fn(),
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

describe('JobForm', () => {
  const onSuccess = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Create Mode', () => {
    it('should render empty form in create mode', () => {
      render(<JobForm onSuccess={onSuccess} onError={onError} />);

      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.getByLabelText('Description')).toHaveValue('');
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByText('Create Job')).toBeInTheDocument();
    });

    it('should handle create job submission', async () => {
      (jobsApi.createJob as jest.Mock).mockResolvedValueOnce(mockJob);

      render(<JobForm onSuccess={onSuccess} onError={onError} />);

      await userEvent.type(screen.getByLabelText('Title'), 'New Job');
      await userEvent.type(screen.getByLabelText('Description'), 'Job Description');
      await userEvent.selectOptions(screen.getByLabelText('Language'), 'en');

      fireEvent.submit(screen.getByRole('button'));

      await waitFor(() => {
        expect(jobsApi.createJob).toHaveBeenCalledWith({
          title: 'New Job',
          description: 'Job Description',
          language_code: 'en',
        });
        expect(onSuccess).toHaveBeenCalledWith(mockJob);
      });
    });

    it('should handle create job error', async () => {
      const error = new Error('Failed to create job');
      (jobsApi.createJob as jest.Mock).mockRejectedValueOnce(error);

      render(<JobForm onSuccess={onSuccess} onError={onError} />);

      await userEvent.type(screen.getByLabelText('Title'), 'New Job');
      await userEvent.type(screen.getByLabelText('Description'), 'Job Description');

      fireEvent.submit(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to create job');
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render form with job data in edit mode', () => {
      render(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      expect(screen.getByLabelText('Title')).toHaveValue(mockJob.title);
      expect(screen.getByLabelText('Description')).toHaveValue(mockJob.description);
      expect(screen.queryByLabelText('Language')).not.toBeInTheDocument();
      expect(screen.getByText('Update Job')).toBeInTheDocument();
    });

    it('should handle update job submission', async () => {
      const updatedJob = { ...mockJob, title: 'Updated Job' };
      (jobsApi.updateJob as jest.Mock).mockResolvedValueOnce(updatedJob);

      render(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      const titleInput = screen.getByLabelText('Title');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Job');

      fireEvent.submit(screen.getByRole('button'));

      await waitFor(() => {
        expect(jobsApi.updateJob).toHaveBeenCalledWith(mockJob.id, {
          title: 'Updated Job',
          description: mockJob.description,
        });
        expect(onSuccess).toHaveBeenCalledWith(updatedJob);
      });
    });

    it('should handle update job error', async () => {
      const error = new Error('Failed to update job');
      (jobsApi.updateJob as jest.Mock).mockRejectedValueOnce(error);

      render(<JobForm job={mockJob} onSuccess={onSuccess} onError={onError} />);

      await userEvent.type(screen.getByLabelText('Title'), 'Updated Job');
      fireEvent.submit(screen.getByRole('button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to update job');
      });
    });
  });

  it('should disable submit button while submitting', async () => {
    (jobsApi.createJob as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    render(<JobForm onSuccess={onSuccess} onError={onError} />);

    await userEvent.type(screen.getByLabelText('Title'), 'New Job');
    await userEvent.type(screen.getByLabelText('Description'), 'Job Description');

    fireEvent.submit(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
