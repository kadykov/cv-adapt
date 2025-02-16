import type { components, operations } from './api-schema';

// Re-export schema types
export type UserResponse = components['schemas']['UserResponse'];
export type User = UserResponse; // Alias for clarity
export type AuthResponse = components['schemas']['AuthResponse'];

// Job types
export type JobDescriptionResponse = components['schemas']['JobDescriptionResponse'];
export type JobDescriptionCreate = components['schemas']['JobDescriptionCreate'];
export type JobDescriptionUpdate = components['schemas']['JobDescriptionUpdate'];

// CV types
export type DetailedCVResponse = components['schemas']['DetailedCVResponse'];
export type DetailedCVCreate = components['schemas']['DetailedCVCreate'];
export type GeneratedCVResponse = components['schemas']['GeneratedCVResponse'];
export type GeneratedCVCreate = components['schemas']['GeneratedCVCreate'];
export type GenerateCVRequest = components['schemas']['GenerateCVRequest'];

// Contact and Personal Info types
export type PersonalInfo = components['schemas']['PersonalInfo'];
export type ContactRequest = components['schemas']['ContactRequest'];

// Operation types
export type LoginOperation = operations['login_v1_auth_login_post'];
export type RegisterOperation = operations['register_v1_auth_register_post'];
export type GetJobsOperation = operations['get_jobs_jobs_get'];
export type CreateJobOperation = operations['create_job_jobs_post'];
export type UpdateJobOperation = operations['update_job_jobs__job_id__put'];
export type DeleteJobOperation = operations['delete_job_jobs__job_id__delete'];

// Request types
export type LoginRequest = LoginOperation['requestBody']['content']['application/x-www-form-urlencoded'];
export type RegisterRequest = RegisterOperation['requestBody']['content']['application/json'];
export type CreateJobRequest = CreateJobOperation['requestBody']['content']['application/json'];
export type UpdateJobRequest = UpdateJobOperation['requestBody']['content']['application/json'];

// Response types
export type LoginResponse = LoginOperation['responses'][200]['content']['application/json'];
export type RegisterResponse = RegisterOperation['responses'][200]['content']['application/json'];
export type GetJobsResponse = GetJobsOperation['responses'][200]['content']['application/json'];
export type CreateJobResponse = CreateJobOperation['responses'][200]['content']['application/json'];
export type UpdateJobResponse = UpdateJobOperation['responses'][200]['content']['application/json'];

// Error types
export type ValidationError = components['schemas']['ValidationError'];
export type HTTPValidationError = components['schemas']['HTTPValidationError'];

// Response type helpers
export type SuccessResponse<T> = {
  data: T;
  status: number;
};

export type ErrorResponse = {
  message: string;
  status: number;
  errors?: ValidationError[];
};

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  confirmPassword: string;
}

// Re-export components and operations for advanced usage
export { components, operations };
