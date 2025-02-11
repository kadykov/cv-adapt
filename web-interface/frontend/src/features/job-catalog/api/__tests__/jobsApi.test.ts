import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobsApi } from '../jobsApi';
import { apiClient } from '../../../../api/core/api-client';
import type { JobDescriptionCreate, JobDescriptionUpdate, JobDescriptionResponse } from '../../../../types/api';

vi.mock('../../../../api/core/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('jobsApi', () => {
  const mockJob: JobDescriptionResponse = {
    id: 1,
    title: 'Software Engineer',
    description: 'Test description',
    requirements: ['React', 'TypeScript'],
    language_code: 'en',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobs', () => {
    it('fetches all jobs', async () => {
      const jobs = [mockJob];
      vi.mocked(apiClient.get).mockResolvedValue(jobs);

      const result = await jobsApi.getJobs();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/jobs');
      expect(result).toEqual(jobs);
    });
  });

  describe('getJobById', () => {
    it('fetches a job by id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockJob);

      const result = await jobsApi.getJobById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/jobs/1');
      expect(result).toEqual(mockJob);
    });
  });

  describe('createJob', () => {
    it('creates a new job', async () => {
      const newJob: JobDescriptionCreate = {
        title: 'New Job',
        description: 'New description',
        language_code: 'en',
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockJob);

      const result = await jobsApi.createJob(newJob);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/jobs', newJob);
      expect(result).toEqual(mockJob);
    });
  });

  describe('updateJob', () => {
    it('updates an existing job', async () => {
      const update: JobDescriptionUpdate = {
        title: 'Updated Job',
      };
      vi.mocked(apiClient.put).mockResolvedValue({ ...mockJob, ...update });

      const result = await jobsApi.updateJob(1, update);

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/jobs/1', update);
      expect(result).toEqual({ ...mockJob, ...update });
    });
  });

  describe('deleteJob', () => {
    it('deletes a job', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await jobsApi.deleteJob(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/jobs/1');
    });
  });
});
