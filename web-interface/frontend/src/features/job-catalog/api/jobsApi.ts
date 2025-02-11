import { apiClient } from '../../../api/core/api-client';
import { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '../../../types/api';

export const jobsApi = {
  getJobs: async (): Promise<JobDescriptionResponse[]> => {
    return apiClient.get<JobDescriptionResponse[]>('/jobs');
  },

  getJobById: async (id: number): Promise<JobDescriptionResponse> => {
    return apiClient.get<JobDescriptionResponse>(`/jobs/${id}`);
  },

  createJob: async (job: JobDescriptionCreate): Promise<JobDescriptionResponse> => {
    return apiClient.post<JobDescriptionResponse>('/jobs', job);
  },

  updateJob: async (id: number, job: JobDescriptionUpdate): Promise<JobDescriptionResponse> => {
    return apiClient.put<JobDescriptionResponse>(`/jobs/${id}`, job);
  },

  deleteJob: async (id: number): Promise<void> => {
    return apiClient.delete(`/jobs/${id}`);
  }
};
