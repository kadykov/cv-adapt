import { describe, it, expect, beforeEach } from 'vitest';
import { JobsService } from '@/api/services/JobsService';
import { ApiError } from '@/api/core/ApiError';
import { createTestHelpers } from '@/tests/setup';
import type { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '@/types/api';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Test description',
  language_code: 'en',
  created_at: new Date().toISOString(),
  updated_at: null
};

describe('JobsService', () => {
  const { simulateSuccess, simulateError } = createTestHelpers();
  let jobsService: JobsService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'mock_token');
    jobsService = new JobsService();
  });

  describe('getJobs', () => {
    it('should fetch all jobs successfully', async () => {
      simulateSuccess('/api/v1/jobs', 'get', [mockJob]);

      const jobs = await jobsService.getJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs[0]).toMatchObject<Partial<JobDescriptionResponse>>({
        id: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        language_code: expect.any(String),
        created_at: expect.any(String)
      });
    });

    it('should handle unauthorized error', async () => {
      simulateError('/api/v1/jobs', 'get', 401, 'Could not validate credentials');

      await expect(jobsService.getJobs()).rejects.toMatchObject({
        message: 'Could not validate credentials'
      });
    });

    it('should handle network error', async () => {
      simulateError('/api/v1/jobs', 'get', 0, 'Network Error');
      await expect(jobsService.getJobs()).rejects.toThrow('Network Error');
    });

    it('should handle validation error', async () => {
      simulateError('/api/v1/jobs', 'get', 422, 'Validation Error');
      await expect(jobsService.getJobs()).rejects.toThrow(ApiError);
    });
  });

  describe('getJob', () => {
    it('should fetch a single job successfully', async () => {
      simulateSuccess('/api/v1/jobs/1', 'get', mockJob);

      const job = await jobsService.getJob(1);
      expect(job).toMatchObject<Partial<JobDescriptionResponse>>({
        id: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        language_code: expect.any(String),
        created_at: expect.any(String)
      });
    });

    it('should handle not found error', async () => {
      simulateError('/api/v1/jobs/999', 'get', 404, 'Job description not found');
      await expect(jobsService.getJob(999)).rejects.toMatchObject({
        message: 'Job description not found'
      });
    });

    it('should handle validation error', async () => {
      simulateError('/api/v1/jobs/1', 'get', 422, 'Validation Error');
      await expect(jobsService.getJob(1)).rejects.toMatchObject({
        message: 'Validation Error'
      });
    });
  });

  describe('createJob', () => {
    const newJob: JobDescriptionCreate = {
      title: 'New Job',
      description: 'New description',
      language_code: 'fr'
    };

    it('should create a job successfully', async () => {
      const createdJob: JobDescriptionResponse = {
        ...mockJob,
        ...newJob
      };
      simulateSuccess('/api/v1/jobs', 'post', createdJob);

      const result = await jobsService.createJob(newJob);
      expect(result).toMatchObject<Partial<JobDescriptionResponse>>({
        id: expect.any(Number),
        title: newJob.title,
        description: newJob.description,
        language_code: newJob.language_code,
        created_at: expect.any(String)
      });
    });

    it('should handle validation error', async () => {
      simulateError('/api/v1/jobs', 'post', 422, 'Validation Error');
      await expect(jobsService.createJob(newJob)).rejects.toThrow(ApiError);
    });
  });

  describe('updateJob', () => {
    const updatedFields = {
      title: 'Updated Title',
      description: 'Updated description'
    } satisfies JobDescriptionUpdate;

    it('should update a job successfully', async () => {
      const updatedJob: JobDescriptionResponse = {
        ...mockJob,
        title: updatedFields.title ?? mockJob.title,
        description: updatedFields.description ?? mockJob.description
      };
      simulateSuccess('/api/v1/jobs/1', 'put', updatedJob);

      const result = await jobsService.updateJob(1, updatedFields);
      expect(result).toMatchObject<Partial<JobDescriptionResponse>>({
        id: mockJob.id,
        title: updatedFields.title,
        description: updatedFields.description,
        language_code: mockJob.language_code,
        created_at: expect.any(String)
      });
    });

    it('should handle not found error', async () => {
      simulateError('/api/v1/jobs/999', 'put', 404, 'Job description not found');
      await expect(jobsService.updateJob(999, updatedFields)).rejects.toMatchObject({
        message: 'Job description not found'
      });
    });

    it('should handle validation error', async () => {
      simulateError('/api/v1/jobs/1', 'put', 422, 'Validation Error');
      await expect(jobsService.updateJob(1, updatedFields)).rejects.toMatchObject({
        message: 'Validation Error'
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete a job successfully', async () => {
      simulateSuccess('/api/v1/jobs/1', 'delete', null);
      await expect(jobsService.deleteJob(1)).resolves.not.toThrow();
    });

    it('should handle not found error', async () => {
      simulateError('/api/v1/jobs/999', 'delete', 404, 'Job description not found');
      await expect(jobsService.deleteJob(999)).rejects.toMatchObject({
        message: 'Job description not found'
      });
    });

    it('should handle validation error', async () => {
      simulateError('/api/v1/jobs/1', 'delete', 422, 'Validation Error');
      await expect(jobsService.deleteJob(1)).rejects.toMatchObject({
        message: 'Validation Error'
      });
    });
  });
});
