import type { JobDescriptionCreate, JobDescriptionResponse, JobDescriptionUpdate } from '../../../types/api';
import { apiClient } from '../../../api/client';

export const jobsApi = {
  /**
   * Get all job descriptions
   */
  async getJobs(): Promise<JobDescriptionResponse[]> {
    return apiClient.get<JobDescriptionResponse[]>('/jobs');
  },

  /**
   * Get a single job description by ID
   */
  async getJob(id: number): Promise<JobDescriptionResponse> {
    return apiClient.get<JobDescriptionResponse>(`/jobs/${id}`);
  },

  /**
   * Create a new job description
   */
  async createJob(data: JobDescriptionCreate): Promise<JobDescriptionResponse> {
    return apiClient.post<JobDescriptionResponse>('/jobs', data);
  },

  /**
   * Update an existing job description
   */
  async updateJob(id: number, data: JobDescriptionUpdate): Promise<JobDescriptionResponse> {
    return apiClient.put<JobDescriptionResponse>(`/jobs/${id}`, data);
  },

  /**
   * Delete a job description
   */
  async deleteJob(id: number): Promise<void> {
    return apiClient.delete(`/jobs/${id}`);
  }
};
