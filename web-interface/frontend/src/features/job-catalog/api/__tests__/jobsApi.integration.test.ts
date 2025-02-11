import { describe, it, expect } from 'vitest';
import { jobsApi } from '../jobsApi';
import { JobDescriptionResponse } from '../../../../types/api';

describe('jobsApi integration', () => {
  describe('getJobs', () => {
    it('fetches jobs successfully', async () => {
      const jobs = await jobsApi.getJobs();

      expect(jobs).toEqual([
        expect.objectContaining<Partial<JobDescriptionResponse>>({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          requirements: expect.any(Array),
          language_code: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      ]);
    });
  });

  describe('getJobById', () => {
    it('fetches a single job by id', async () => {
      const job = await jobsApi.getJobById(1);

      expect(job).toEqual(
        expect.objectContaining<Partial<JobDescriptionResponse>>({
          id: 1,
          title: expect.any(String),
          description: expect.any(String),
          requirements: expect.any(Array),
          language_code: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String)
        })
      );
    });

    it('throws error for non-existent job', async () => {
      await expect(jobsApi.getJobById(999)).rejects.toThrow();
    });
  });
});
