import { expect, test, describe, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  AuthResponse,
  JobDescriptionCreate,
  JobDescriptionResponse,
  JobDescriptionUpdate,
  GenerateCVRequest,
  GeneratedCVCreate,
  GeneratedCVResponse,
  HTTPValidationError,
  PersonalInfo,
  ContactRequest
} from '@/types/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Generated API Types', () => {
  let apiSchemaContent: string;
  let apiTypesContent: string;

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../types/api-schema.ts');
    const typesPath = path.resolve(__dirname, '../types/api.ts');
    apiSchemaContent = await fs.readFile(schemaPath, 'utf-8');
    apiTypesContent = await fs.readFile(typesPath, 'utf-8');
  });

  test('api-schema.ts content validation', () => {
    // Should not contain [object Object]
    expect(apiSchemaContent).not.toContain('[object Object]');

    // Should contain proper interface/type declarations
    expect(apiSchemaContent).toMatch(/interface components {/);
    expect(apiSchemaContent).toMatch(/export type paths/);
    expect(apiSchemaContent).toMatch(/export type operations/);

    // Should contain the schema components we use
    expect(apiSchemaContent).toMatch(/JobDescriptionResponse/);
    expect(apiSchemaContent).toMatch(/JobDescriptionCreate/);
    expect(apiSchemaContent).toMatch(/JobDescriptionUpdate/);
    expect(apiSchemaContent).toMatch(/AuthResponse/);
  });

  test('api.ts type exports', () => {
    // Should export all necessary types
    expect(apiTypesContent).toMatch(/export type JobDescriptionResponse/);
    expect(apiTypesContent).toMatch(/export type JobDescriptionCreate/);
    expect(apiTypesContent).toMatch(/export type JobDescriptionUpdate/);
    expect(apiTypesContent).toMatch(/export type AuthResponse/);
    expect(apiTypesContent).toMatch(/export type ValidationError/);
    expect(apiTypesContent).toMatch(/export type HTTPValidationError/);
  });

  test('auth schema types', () => {
    const loginResponse: AuthResponse = {
      access_token: 'token123',
      refresh_token: 'refresh123',
      token_type: 'bearer',
      user: {
        email: 'test@example.com',
        id: 1,
        created_at: new Date().toISOString(),
        personal_info: null
      }
    };

    expect(loginResponse.access_token).toBe('token123');
    expect(loginResponse.user.email).toBe('test@example.com');

    // Type checks (using void to avoid unused variable warnings)
    void (() => {
      // @ts-expect-error - token_type must be 'bearer'
      const invalidType: AuthResponse = { ...loginResponse, token_type: 'invalid' };
      return invalidType;
    })();

    void (() => {
      // @ts-expect-error - user.id must be number
      const invalidId: AuthResponse = { ...loginResponse, user: { ...loginResponse.user, id: '1' } };
      return invalidId;
    })();
  });

  test('job description schema types', () => {
    const jobDesc: JobDescriptionCreate = {
      title: 'Software Engineer',
      description: 'Full stack developer position',
      language_code: 'en'
    };

    const jobResponse: JobDescriptionResponse = {
      ...jobDesc,
      id: 1,
      created_at: new Date().toISOString(),
      updated_at: null
    };

    const jobUpdate: JobDescriptionUpdate = {
      title: 'Senior Software Engineer',
      description: undefined // Optional field
    };

    expect(jobResponse.title).toBe('Software Engineer');
    expect(jobResponse.id).toBe(1);
    expect(jobUpdate.description).toBeUndefined();

    // Type checks (using void to avoid unused variable warnings)
    void (() => {
      // @ts-expect-error - language_code is required in create
      const invalidCreate: JobDescriptionCreate = { title: 'Test', description: 'Test' };
      return invalidCreate;
    })();

    void (() => {
      // @ts-expect-error - id is required in response
      const invalidResponse: JobDescriptionResponse = { ...jobDesc };
      return invalidResponse;
    })();
  });

  test('validation error schema type', () => {
    const error: HTTPValidationError = {
      detail: [{
        loc: ['body', 'email'],
        msg: 'Invalid email format',
        type: 'value_error'
      }]
    };

    expect(error.detail?.[0].msg).toBe('Invalid email format');

    // Type checks (using void to avoid unused variable warnings)
    void (() => {
      // @ts-expect-error - loc must be array
      const invalidLoc: HTTPValidationError = { detail: [{ loc: 'body', msg: 'Error', type: 'error' }] };
      return invalidLoc;
    })();
  });

  test('cv generation schema types', () => {
    const contactInfo: ContactRequest = {
      value: 'john@example.com',
      type: 'email'
    };

    const personalInfo: PersonalInfo = {
      full_name: 'John Doe',
      email: contactInfo,
      phone: null
    };

    const request: GenerateCVRequest = {
      cv_text: 'My CV content',
      job_description: 'Job requirements',
      personal_info: personalInfo,
      approved_competences: ['Node.js', 'React'],
      notes: 'Additional notes'
    };

    expect(request.personal_info.full_name).toBe('John Doe');
    expect(request.approved_competences).toHaveLength(2);

    // Type checks (using void to avoid unused variable warnings)
    void (() => {
      // @ts-expect-error - full_name is required
      const invalidPersonalInfo: PersonalInfo = { email: contactInfo };
      return invalidPersonalInfo;
    })();

    void (() => {
      // @ts-expect-error - email is required
      const invalidRequest: GenerateCVRequest = { ...request, personal_info: { full_name: 'John' } };
      return invalidRequest;
    })();
  });

  test('cv storage schema types', () => {
    const generatedCV: GeneratedCVCreate = {
      language_code: 'en',
      content: {},
      detailed_cv_id: 1,
      job_description_id: 2
    };

    const response: GeneratedCVResponse = {
      ...generatedCV,
      id: 1,
      created_at: new Date().toISOString(),
      user_id: 1
    };

    expect(response.id).toBe(1);
    expect(response.language_code).toBe('en');

    // Type checks (using void to avoid unused variable warnings)
    void (() => {
      // @ts-expect-error - detailed_cv_id is required
      const invalidCreate: GeneratedCVCreate = { language_code: 'en', content: {} };
      return invalidCreate;
    })();

    void (() => {
      // @ts-expect-error - user_id is required
      const invalidResponse: GeneratedCVResponse = { ...generatedCV, id: 1, created_at: '' };
      return invalidResponse;
    })();
  });
});
