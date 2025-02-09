import { describe, expect, it, beforeEach } from 'vitest';
import type { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '../../../../types/api';
import { jobsApi } from '../jobsApi';

const mockJob: JobDescriptionResponse = {
  id: 1,
  title: 'Software Engineer',
  description: 'Full stack developer position',
  language_code: 'en',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
};

describe('jobsApi', () => {
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getJobs', () => {
    it('should fetch all jobs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockJob],
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      const jobs = await jobsApi.getJobs();

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(jobs).toEqual([mockJob]);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        json: async () => ({ message: 'Request failed' })
      });

      await expect(jobsApi.getJobs()).rejects.toThrow('Request failed');
    });
  });

  describe('getJob', () => {
    it('should fetch a single job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      const job = await jobsApi.getJob(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs/1', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(job).toEqual(mockJob);
    });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const newJob: JobDescriptionCreate = {
        title: 'New Job',
        description: 'Description',
        language_code: 'en',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, ...newJob }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      const job = await jobsApi.createJob(newJob);

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });
      expect(job.title).toBe(newJob.title);
    });
  });

  describe('updateJob', () => {
    it('should update an existing job', async () => {
      const updateData: JobDescriptionUpdate = {
        title: 'Updated Title',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockJob, ...updateData }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      const job = await jobsApi.updateJob(1, updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      expect(job.title).toBe(updateData.title);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });

      await jobsApi.deleteJob(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/jobs/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });
  });
});
