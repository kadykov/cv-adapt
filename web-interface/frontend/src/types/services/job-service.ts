
import { z } from 'zod';
import { BaseService } from './base-service';
import type { ApiResponse } from '../api-utils';
import { schemas } from '../zod-schemas';

export class JobService extends BaseService {
  /**
   * Get all job descriptions for a language
   */
  async getJobs(languageCode: string = 'en'): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>[]>> {
    try {
      const response = await this.client['/jobs'].get({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(z.array(schemas.JobDescriptionResponse), response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new job description
   */
  async createJob(job: z.infer<typeof schemas.JobDescriptionCreate>): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs'].post({
        body: job
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get job description by ID
   */
  async getJobById(jobId: number): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs/:job_id'].get({
        params: { job_id: jobId }
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update job description
   */
  async updateJob(
    jobId: number,
    job: z.infer<typeof schemas.JobDescriptionUpdate>
  ): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs/:job_id'].put({
        params: { job_id: jobId },
        body: job
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete job description
   */
  async deleteJob(jobId: number): Promise<void> {
    try {
      await this.client['/jobs/:job_id'].delete({
        params: { job_id: jobId }
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
