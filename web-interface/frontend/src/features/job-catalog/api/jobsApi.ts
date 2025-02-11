import { apiClient } from '../../../api/core/api-client';
import { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '../../../types/api';

export const jobsApi = {
  getJobs: async (): Promise<JobDescriptionResponse[]> => {
    return apiClient.get<JobDescriptionResponse[]>('/api/v1/jobs');
  },

  getJobById: async (id: number): Promise<JobDescriptionResponse> => {
    return apiClient.get<JobDescriptionResponse>(`/api/v1/jobs/${id}`);
  },

  createJob: async (job: JobDescriptionCreate): Promise<JobDescriptionResponse> => {
    return apiClient.post<JobDescriptionResponse>('/api/v1/jobs', job);
  },

  updateJob: async (id: number, job: JobDescriptionUpdate): Promise<JobDescriptionResponse> => {
    return apiClient.put<JobDescriptionResponse>(`/api/v1/jobs/${id}`, job);
  },

  deleteJob: async (id: number): Promise<void> => {
    return apiClient.delete(`/api/v1/jobs/${id}`);
  }
};
