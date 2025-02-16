import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const UserCreate = z
  .object({ email: z.string().email(), password: z.string() })
  .passthrough();
const UserResponse = z
  .object({
    email: z.string().email(),
    id: z.number().int(),
    created_at: z.string().datetime({ offset: true }),
    personal_info: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .passthrough();
const AuthResponse = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string().optional().default("bearer"),
    user: UserResponse,
  })
  .passthrough();
const ValidationError = z
  .object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
  })
  .passthrough();
const HTTPValidationError = z
  .object({ detail: z.array(ValidationError) })
  .partial()
  .passthrough();
const Body_login_v1_api_auth_login_post = z
  .object({
    grant_type: z.union([z.string(), z.null()]).optional(),
    username: z.string(),
    password: z.string(),
    scope: z.string().optional().default(""),
    client_id: z.union([z.string(), z.null()]).optional(),
    client_secret: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const Body_refresh_token_v1_api_auth_refresh_post = z
  .object({ token: z.string() })
  .passthrough();
const UserUpdate = z
  .object({ personal_info: z.object({}).partial().passthrough() })
  .passthrough();
const DetailedCVResponse = z
  .object({
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.union([z.string(), z.null()]).optional(),
    language_code: z.string(),
    content: z.object({}).partial().passthrough(),
    is_primary: z.boolean().optional().default(false),
    id: z.number().int(),
    user_id: z.number().int(),
  })
  .passthrough();
const DetailedCVCreate = z
  .object({
    language_code: z.string(),
    content: z.object({}).partial().passthrough(),
    is_primary: z.boolean().optional().default(false),
  })
  .passthrough();
const JobDescriptionResponse = z
  .object({
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.union([z.string(), z.null()]).optional(),
    title: z.string(),
    description: z.string(),
    language_code: z.string(),
    id: z.number().int(),
  })
  .passthrough();
const JobDescriptionCreate = z
  .object({
    title: z.string(),
    description: z.string(),
    language_code: z.string(),
  })
  .passthrough();
const JobDescriptionUpdate = z
  .object({
    title: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough();
const GenerateCompetencesRequest = z
  .object({
    cv_text: z.string(),
    job_description: z.string(),
    notes: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const ContactRequest = z
  .object({
    value: z.string(),
    type: z.string(),
    icon: z.union([z.string(), z.null()]).optional(),
    url: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const PersonalInfo = z
  .object({
    full_name: z.string(),
    email: ContactRequest,
    phone: z.union([ContactRequest, z.null()]).optional(),
    location: z.union([ContactRequest, z.null()]).optional(),
  })
  .passthrough();
const GenerateCVRequest = z
  .object({
    cv_text: z.string(),
    job_description: z.string(),
    personal_info: PersonalInfo,
    approved_competences: z.array(z.string()),
    notes: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const GeneratedCVResponse = z
  .object({
    language_code: z.string(),
    content: z.object({}).partial().passthrough(),
    id: z.number().int(),
    created_at: z.string().datetime({ offset: true }),
    user_id: z.number().int(),
    detailed_cv_id: z.number().int(),
    job_description_id: z.number().int(),
  })
  .passthrough();
const GeneratedCVCreate = z
  .object({
    language_code: z.string(),
    content: z.object({}).partial().passthrough(),
    detailed_cv_id: z.number().int(),
    job_description_id: z.number().int(),
  })
  .passthrough();

export const schemas = {
  UserCreate,
  UserResponse,
  AuthResponse,
  ValidationError,
  HTTPValidationError,
  Body_login_v1_api_auth_login_post,
  Body_refresh_token_v1_api_auth_refresh_post,
  UserUpdate,
  DetailedCVResponse,
  DetailedCVCreate,
  JobDescriptionResponse,
  JobDescriptionCreate,
  JobDescriptionUpdate,
  GenerateCompetencesRequest,
  ContactRequest,
  PersonalInfo,
  GenerateCVRequest,
  GeneratedCVResponse,
  GeneratedCVCreate,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/v1/api/auth/login",
    alias: "login_v1_api_auth_login_post",
    description: `Login user.`,
    requestFormat: "form-url",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Body_login_v1_api_auth_login_post,
      },
    ],
    response: AuthResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/api/auth/logout",
    alias: "logout_v1_api_auth_logout_post",
    description: `Logout user.`,
    requestFormat: "json",
    response: z.record(z.string()),
  },
  {
    method: "post",
    path: "/v1/api/auth/refresh",
    alias: "refresh_token_v1_api_auth_refresh_post",
    description: `Refresh access token using refresh token.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ token: z.string() }).passthrough(),
      },
    ],
    response: AuthResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/api/auth/register",
    alias: "register_v1_api_auth_register_post",
    description: `Register a new user.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UserCreate,
      },
    ],
    response: AuthResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/generations",
    alias: "get_user_generations_v1_api_generations_get",
    description: `Get all generated CVs for current user.`,
    requestFormat: "json",
    response: z.array(GeneratedCVResponse),
  },
  {
    method: "post",
    path: "/v1/api/generations",
    alias: "generate_and_save_cv_v1_api_generations_post",
    description: `Generate and save a new CV for job application.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GeneratedCVCreate,
      },
    ],
    response: GeneratedCVResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/generations/:cv_id",
    alias: "get_generated_cv_v1_api_generations__cv_id__get",
    description: `Get a specific generated CV.`,
    requestFormat: "json",
    parameters: [
      {
        name: "cv_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: GeneratedCVResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/api/generations/competences",
    alias: "generate_competences_v1_api_generations_competences_post",
    description: `Generate core competences from CV and job description.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GenerateCompetencesRequest,
      },
      {
        name: "language_code",
        type: "Query",
        schema: z.string().optional().default("en"),
      },
    ],
    response: z.record(z.array(z.string())),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/api/generations/cv",
    alias: "generate_cv_v1_api_generations_cv_post",
    description: `Generate a complete CV using core competences.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: GenerateCVRequest,
      },
      {
        name: "language_code",
        type: "Query",
        schema: z.string().optional().default("en"),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/jobs",
    alias: "get_jobs_v1_api_jobs_get",
    description: `Get all job descriptions for a language.`,
    requestFormat: "json",
    parameters: [
      {
        name: "language_code",
        type: "Query",
        schema: z.string().optional().default("en"),
      },
    ],
    response: z.array(JobDescriptionResponse),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/api/jobs",
    alias: "create_job_v1_api_jobs_post",
    description: `Create new job description.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: JobDescriptionCreate,
      },
    ],
    response: JobDescriptionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/jobs/:job_id",
    alias: "get_job_v1_api_jobs__job_id__get",
    description: `Get job description by ID.`,
    requestFormat: "json",
    parameters: [
      {
        name: "job_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: JobDescriptionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/api/jobs/:job_id",
    alias: "update_job_v1_api_jobs__job_id__put",
    description: `Update job description.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: JobDescriptionUpdate,
      },
      {
        name: "job_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: JobDescriptionResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/v1/api/jobs/:job_id",
    alias: "delete_job_v1_api_jobs__job_id__delete",
    description: `Delete job description.`,
    requestFormat: "json",
    parameters: [
      {
        name: "job_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/user/detailed-cvs",
    alias: "get_user_detailed_cvs_v1_api_user_detailed_cvs_get",
    description: `Get all user&#x27;s detailed CVs.`,
    requestFormat: "json",
    response: z.array(DetailedCVResponse),
  },
  {
    method: "get",
    path: "/v1/api/user/detailed-cvs/:language_code",
    alias: "get_user_detailed_cv_v1_api_user_detailed_cvs__language_code__get",
    description: `Get user&#x27;s detailed CV by language.`,
    requestFormat: "json",
    parameters: [
      {
        name: "language_code",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DetailedCVResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/api/user/detailed-cvs/:language_code",
    alias:
      "upsert_user_detailed_cv_v1_api_user_detailed_cvs__language_code__put",
    description: `Create or update user&#x27;s detailed CV for a language.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DetailedCVCreate,
      },
      {
        name: "language_code",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DetailedCVResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/v1/api/user/detailed-cvs/:language_code",
    alias:
      "delete_user_detailed_cv_v1_api_user_detailed_cvs__language_code__delete",
    description: `Delete user&#x27;s detailed CV by language.`,
    requestFormat: "json",
    parameters: [
      {
        name: "language_code",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/api/user/detailed-cvs/:language_code/primary",
    alias:
      "set_primary_cv_v1_api_user_detailed_cvs__language_code__primary_put",
    description: `Set a CV as primary.`,
    requestFormat: "json",
    parameters: [
      {
        name: "language_code",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DetailedCVResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/v1/api/users/me",
    alias: "get_user_profile_v1_api_users_me_get",
    description: `Get current user&#x27;s profile.`,
    requestFormat: "json",
    response: UserResponse,
  },
  {
    method: "put",
    path: "/v1/api/users/me",
    alias: "update_user_profile_v1_api_users_me_put",
    description: `Update current user&#x27;s profile.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ personal_info: z.object({}).partial().passthrough() })
          .passthrough(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
]);

export const ApiClient = new Zodios("/api/v1", endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
