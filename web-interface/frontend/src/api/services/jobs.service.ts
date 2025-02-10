import { apiClient } from "../core/api-client";
import type { JobDescriptionCreate, JobDescriptionResponse, JobDescriptionUpdate } from "../../types/api";

export class JobsService {
  async getJobs(): Promise<JobDescriptionResponse[]> {
    return apiClient.get<JobDescriptionResponse[]>("jobs");
  }

  async getJob(id: number): Promise<JobDescriptionResponse> {
    return apiClient.get<JobDescriptionResponse>(`jobs/${id}`);
  }

  async createJob(data: JobDescriptionCreate): Promise<JobDescriptionResponse> {
    return apiClient.post<JobDescriptionResponse>("jobs", data);
  }

  async updateJob(
    id: number,
    data: JobDescriptionUpdate
  ): Promise<JobDescriptionResponse> {
    return apiClient.put<JobDescriptionResponse>(`jobs/${id}`, data);
  }

  async deleteJob(id: number): Promise<void> {
    await apiClient.delete(`jobs/${id}`);
  }
}

export const jobsService = new JobsService();
