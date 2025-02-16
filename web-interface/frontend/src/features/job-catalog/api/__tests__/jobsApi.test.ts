import { describe, it, expect, beforeEach } from 'vitest';
import { jobsApi } from '../jobsApi';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionCreate, JobDescriptionUpdate, JobDescriptionResponse } from '@/types/api';

describe('jobsApi', () => {
  const { simulateSuccess, simulateError } = createTestHelpers();

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
    // Reset any handlers from previous tests
    simulateSuccess('/api/v1/jobs', 'get', []);
  });

  describe('getJobs', () => {
    it('fetches all jobs', async () => {
      const jobs = [mockJob];
      simulateSuccess('/api/v1/jobs', 'get', jobs);

      const result = await jobsApi.getJobs();
      expect(result).toEqual(jobs);
    });

    it('handles error response', async () => {
      simulateError('/api/v1/jobs', 'get', 500, 'Server error');

      await expect(jobsApi.getJobs()).rejects.toThrow('Server error');
    });
  });

  describe('getJobById', () => {
    it('fetches a job by id', async () => {
      simulateSuccess(`/api/v1/jobs/${mockJob.id}`, 'get', mockJob);

      const result = await jobsApi.getJobById(mockJob.id);
      expect(result).toEqual(mockJob);
    });

    it('handles not found error', async () => {
      simulateError(`/api/v1/jobs/999`, 'get', 404, 'Job not found');

      await expect(jobsApi.getJobById(999)).rejects.toThrow('Job not found');
    });
  });

  describe('createJob', () => {
    it('creates a new job', async () => {
      const newJob: JobDescriptionCreate = {
        title: 'New Job',
        description: 'New description',
        language_code: 'en',
      };
      simulateSuccess('/api/v1/jobs', 'post', { ...mockJob, ...newJob });

      const result = await jobsApi.createJob(newJob);
      expect(result).toMatchObject(newJob);
    });

    it('handles validation error', async () => {
      const invalidJob: JobDescriptionCreate = {
        title: '', // Empty title should fail validation
        description: 'New description',
        language_code: 'en',
      };
      simulateError('/api/v1/jobs', 'post', 422, 'Title is required');

      await expect(jobsApi.createJob(invalidJob)).rejects.toThrow('Title is required');
    });
  });

  describe('updateJob', () => {
    it('updates an existing job', async () => {
      const update: JobDescriptionUpdate = {
        title: 'Updated Job',
      };
      simulateSuccess(`/api/v1/jobs/${mockJob.id}`, 'put', { ...mockJob, ...update });

      const result = await jobsApi.updateJob(mockJob.id, update);
      expect(result.title).toBe(update.title);
    });

    it('handles not found error on update', async () => {
      const update: JobDescriptionUpdate = { title: 'Updated Job' };
      simulateError('/api/v1/jobs/999', 'put', 404, 'Job not found');

      await expect(jobsApi.updateJob(999, update)).rejects.toThrow('Job not found');
    });
  });

  describe('deleteJob', () => {
    it('deletes a job', async () => {
      simulateSuccess(`/api/v1/jobs/${mockJob.id}`, 'delete', null);

      await expect(jobsApi.deleteJob(mockJob.id)).resolves.not.toThrow();
    });

    it('handles not found error on delete', async () => {
      simulateError('/api/v1/jobs/999', 'delete', 404, 'Job not found');

      await expect(jobsApi.deleteJob(999)).rejects.toThrow('Job not found');
    });
  });
});
