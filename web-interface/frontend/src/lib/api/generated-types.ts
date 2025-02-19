import type { components } from './types';

// Export raw schema types
export type { components, operations, paths } from './types';

// Auth types
export type AuthResponse = components['schemas']['AuthResponse'];
export type RegisterRequest = components['schemas']['UserCreate'];
export type LoginRequest = components['schemas']['Body_login_v1_api_auth_login_post'];
export type User = components['schemas']['UserResponse'];

// Job types
export type JobDescriptionCreate = components['schemas']['JobDescriptionCreate'];
export type JobDescriptionUpdate = components['schemas']['JobDescriptionUpdate'];
export type JobDescriptionResponse = components['schemas']['JobDescriptionResponse'];
export type JobsResponse = JobDescriptionResponse[];

// CV types
export type DetailedCVCreate = components['schemas']['DetailedCVCreate'];
export type DetailedCVResponse = components['schemas']['DetailedCVResponse'];
export type GeneratedCVCreate = components['schemas']['GeneratedCVCreate'];
export type GeneratedCVResponse = components['schemas']['GeneratedCVResponse'];
export type GenerateCVRequest = components['schemas']['GenerateCVRequest'];
export type GenerateCompetencesRequest = components['schemas']['GenerateCompetencesRequest'];

// Common types
export type ErrorResponse = components['schemas']['HTTPValidationError'];
export type ValidationError = components['schemas']['ValidationError'];
