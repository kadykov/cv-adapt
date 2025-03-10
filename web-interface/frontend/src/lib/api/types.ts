/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/v1/api/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Register
     * @description Register a new user.
     */
    post: operations['register_v1_api_auth_register_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Login
     * @description Login user.
     */
    post: operations['login_v1_api_auth_login_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Logout
     * @description Logout user.
     *     Since we're using JWT, we don't need to do anything server-side.
     *     The client should clear the tokens from local storage.
     *     Returns 204 No Content to indicate successful logout without a response body.
     */
    post: operations['logout_v1_api_auth_logout_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/auth/refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Refresh Token
     * @description Refresh access token using refresh token.
     */
    post: operations['refresh_token_v1_api_auth_refresh_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/users/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get User Profile
     * @description Get current user's profile.
     */
    get: operations['get_user_profile_v1_api_users_me_get'];
    /**
     * Update User Profile
     * @description Update current user's profile.
     */
    put: operations['update_user_profile_v1_api_users_me_put'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/user/detailed-cvs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get User Detailed Cvs
     * @description Get all user's detailed CVs.
     */
    get: operations['get_user_detailed_cvs_v1_api_user_detailed_cvs_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/user/detailed-cvs/{language_code}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get User Detailed Cv
     * @description Get user's detailed CV by language.
     */
    get: operations['get_user_detailed_cv_v1_api_user_detailed_cvs__language_code__get'];
    /**
     * Upsert User Detailed Cv
     * @description Create or update user's detailed CV for a language.
     */
    put: operations['upsert_user_detailed_cv_v1_api_user_detailed_cvs__language_code__put'];
    post?: never;
    /**
     * Delete User Detailed Cv
     * @description Delete user's detailed CV by language.
     */
    delete: operations['delete_user_detailed_cv_v1_api_user_detailed_cvs__language_code__delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/user/detailed-cvs/{language_code}/primary': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Set Primary Cv
     * @description Set a CV as primary.
     */
    put: operations['set_primary_cv_v1_api_user_detailed_cvs__language_code__primary_put'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/jobs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get Jobs
     * @description Get all job descriptions for a language.
     */
    get: operations['get_jobs_v1_api_jobs_get'];
    put?: never;
    /**
     * Create Job
     * @description Create new job description.
     */
    post: operations['create_job_v1_api_jobs_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/jobs/{job_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get Job
     * @description Get job description by ID.
     */
    get: operations['get_job_v1_api_jobs__job_id__get'];
    /**
     * Update Job
     * @description Update job description.
     */
    put: operations['update_job_v1_api_jobs__job_id__put'];
    post?: never;
    /**
     * Delete Job
     * @description Delete job description.
     */
    delete: operations['delete_job_v1_api_jobs__job_id__delete'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/generations/competences': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Generate Competences
     * @description Generate core competences from CV and job description.
     */
    post: operations['generate_competences_v1_api_generations_competences_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/generations/cv': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Generate Cv
     * @description Generate a complete CV using core competences.
     */
    post: operations['generate_cv_v1_api_generations_cv_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/generations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get User Generations
     * @description Get all generated CVs for current user.
     */
    get: operations['get_user_generations_v1_api_generations_get'];
    put?: never;
    /**
     * Generate And Save Cv
     * @description Generate and save a new CV for job application.
     */
    post: operations['generate_and_save_cv_v1_api_generations_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/api/generations/{cv_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get Generated Cv
     * @description Get a specific generated CV.
     */
    get: operations['get_generated_cv_v1_api_generations__cv_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /**
     * AuthResponse
     * @description Schema for authentication response.
     */
    AuthResponse: {
      /** Access Token */
      access_token: string;
      /** Refresh Token */
      refresh_token: string;
      /**
       * Token Type
       * @default bearer
       */
      token_type: string;
      user: components['schemas']['UserResponse'];
    };
    /** Body_login_v1_api_auth_login_post */
    Body_login_v1_api_auth_login_post: {
      /** Grant Type */
      grant_type?: string | null;
      /** Username */
      username: string;
      /** Password */
      password: string;
      /**
       * Scope
       * @default
       */
      scope: string;
      /** Client Id */
      client_id?: string | null;
      /** Client Secret */
      client_secret?: string | null;
    };
    /** Body_refresh_token_v1_api_auth_refresh_post */
    Body_refresh_token_v1_api_auth_refresh_post: {
      /** Token */
      token: string;
    };
    /** ContactRequest */
    ContactRequest: {
      /** Value */
      value: string;
      /** Type */
      type: string;
      /** Icon */
      icon?: string | null;
      /** Url */
      url?: string | null;
    };
    /**
     * DetailedCVCreate
     * @description Schema for creating a detailed CV.
     */
    DetailedCVCreate: {
      /** Language Code */
      language_code: string;
      /** Content */
      content: string;
      /**
       * Is Primary
       * @default false
       */
      is_primary: boolean;
    };
    /**
     * DetailedCVResponse
     * @description Schema for detailed CV responses.
     */
    DetailedCVResponse: {
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Updated At */
      updated_at?: string | null;
      /** Language Code */
      language_code: string;
      /** Content */
      content: string;
      /**
       * Is Primary
       * @default false
       */
      is_primary: boolean;
      /** Id */
      id: number;
      /** User Id */
      user_id: number;
    };
    /** GenerateCVRequest */
    GenerateCVRequest: {
      /** Cv Text */
      cv_text: string;
      /** Job Description */
      job_description: string;
      personal_info: components['schemas']['PersonalInfo'];
      /** Approved Competences */
      approved_competences: string[];
      /** Notes */
      notes?: string | null;
    };
    /** GenerateCompetencesRequest */
    GenerateCompetencesRequest: {
      /** Cv Text */
      cv_text: string;
      /** Job Description */
      job_description: string;
      /** Notes */
      notes?: string | null;
    };
    /**
     * GeneratedCVCreate
     * @description Schema for creating a generated CV.
     */
    GeneratedCVCreate: {
      /** Language Code */
      language_code: string;
      /** Content */
      content: string;
      /** Detailed Cv Id */
      detailed_cv_id: number;
      /** Job Description Id */
      job_description_id: number;
    };
    /**
     * GeneratedCVResponse
     * @description Schema for generated CV responses.
     */
    GeneratedCVResponse: {
      /** Language Code */
      language_code: string;
      /** Content */
      content: string;
      /** Id */
      id: number;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** User Id */
      user_id: number;
      /** Detailed Cv Id */
      detailed_cv_id: number;
      /** Job Description Id */
      job_description_id: number;
    };
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components['schemas']['ValidationError'][];
    };
    /**
     * JobDescriptionCreate
     * @description Schema for creating a job description.
     */
    JobDescriptionCreate: {
      /** Title */
      title: string;
      /** Description */
      description: string;
      /** Language Code */
      language_code: string;
    };
    /**
     * JobDescriptionResponse
     * @description Schema for job description responses.
     */
    JobDescriptionResponse: {
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Updated At */
      updated_at?: string | null;
      /** Title */
      title: string;
      /** Description */
      description: string;
      /** Language Code */
      language_code: string;
      /** Id */
      id: number;
    };
    /**
     * JobDescriptionUpdate
     * @description Schema for updating a job description.
     */
    JobDescriptionUpdate: {
      /** Title */
      title?: string | null;
      /** Description */
      description?: string | null;
    };
    /** PersonalInfo */
    PersonalInfo: {
      /** Full Name */
      full_name: string;
      email: components['schemas']['ContactRequest'];
      phone?: components['schemas']['ContactRequest'] | null;
      location?: components['schemas']['ContactRequest'] | null;
    };
    /**
     * UserCreate
     * @description Schema for creating a new user.
     */
    UserCreate: {
      /**
       * Email
       * Format: email
       */
      email: string;
      /** Password */
      password: string;
    };
    /**
     * UserResponse
     * @description Schema for user responses.
     */
    UserResponse: {
      /**
       * Email
       * Format: email
       */
      email: string;
      /** Id */
      id: number;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Personal Info */
      personal_info?: Record<string, never> | null;
    };
    /**
     * UserUpdate
     * @description Schema for updating a user's personal info.
     */
    UserUpdate: {
      /** Personal Info */
      personal_info: Record<string, never>;
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  register_v1_api_auth_register_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuthResponse'];
        };
      };
      /** @description Bad Request - Email already registered */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  login_v1_api_auth_login_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/x-www-form-urlencoded': components['schemas']['Body_login_v1_api_auth_login_post'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuthResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  logout_v1_api_auth_logout_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  refresh_token_v1_api_auth_refresh_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['Body_refresh_token_v1_api_auth_refresh_post'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuthResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_user_profile_v1_api_users_me_get: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserResponse'];
        };
      };
    };
  };
  update_user_profile_v1_api_users_me_put: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserUpdate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_user_detailed_cvs_v1_api_user_detailed_cvs_get: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DetailedCVResponse'][];
        };
      };
    };
  };
  get_user_detailed_cv_v1_api_user_detailed_cvs__language_code__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        language_code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DetailedCVResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  upsert_user_detailed_cv_v1_api_user_detailed_cvs__language_code__put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        language_code: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['DetailedCVCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DetailedCVResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  delete_user_detailed_cv_v1_api_user_detailed_cvs__language_code__delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        language_code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  set_primary_cv_v1_api_user_detailed_cvs__language_code__primary_put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        language_code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DetailedCVResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_jobs_v1_api_jobs_get: {
    parameters: {
      query?: {
        language_code?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['JobDescriptionResponse'][];
        };
      };
      /** @description Unauthorized - Invalid or missing token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  create_job_v1_api_jobs_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['JobDescriptionCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['JobDescriptionResponse'];
        };
      };
      /** @description Unauthorized - Invalid or missing token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_job_v1_api_jobs__job_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        job_id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['JobDescriptionResponse'];
        };
      };
      /** @description Unauthorized - Invalid or missing token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  update_job_v1_api_jobs__job_id__put: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        job_id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['JobDescriptionUpdate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['JobDescriptionResponse'];
        };
      };
      /** @description Unauthorized - Invalid or missing token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  delete_job_v1_api_jobs__job_id__delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        job_id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - Invalid or missing token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Job not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  generate_competences_v1_api_generations_competences_post: {
    parameters: {
      query?: {
        language_code?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['GenerateCompetencesRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            [key: string]: string[];
          };
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  generate_cv_v1_api_generations_cv_post: {
    parameters: {
      query?: {
        language_code?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['GenerateCVRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': unknown;
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_user_generations_v1_api_generations_get: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['GeneratedCVResponse'][];
        };
      };
    };
  };
  generate_and_save_cv_v1_api_generations_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['GeneratedCVCreate'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['GeneratedCVResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
  get_generated_cv_v1_api_generations__cv_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        cv_id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['GeneratedCVResponse'];
        };
      };
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HTTPValidationError'];
        };
      };
    };
  };
}
