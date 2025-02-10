import { apiClient } from "./core/api-client";
import { ApiError } from "./core/api-error";
import { apiConfig } from "./config/api-config";
import type { RequestOptions } from "./config/api-config";
import { jobsService } from "./services/jobs.service";
import { authService } from "./services/auth.service";

// Re-export core functionality
export { apiClient, ApiError, apiConfig };
export type { RequestOptions };

// Re-export services directly
export { authService, jobsService };

// Create a centralized API object that provides access to all services
export const api = {
  auth: authService,
  jobs: jobsService,
} as const;
