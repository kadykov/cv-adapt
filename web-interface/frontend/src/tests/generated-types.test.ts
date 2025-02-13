import { expect, test, describe, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { schemas } from '../types/api-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Generated API Types', () => {
  let apiSchemaContent: string;

  beforeAll(async () => {
    const schemaPath = path.resolve(__dirname, '../types/api-schema.ts');
    apiSchemaContent = await fs.readFile(schemaPath, 'utf-8');
  });

  test('api-schema.ts content validation', () => {
    // Should not contain [object Object]
    expect(apiSchemaContent).not.toContain('[object Object]');

    // Should contain proper interface/type declarations
    expect(apiSchemaContent).toMatch(/interface components {/);
    expect(apiSchemaContent).toMatch(/export type paths/);
    expect(apiSchemaContent).toMatch(/export type schemas/);

    // Should contain the schema components we use
    expect(apiSchemaContent).toMatch(/JobDescriptionResponse/);
    expect(apiSchemaContent).toMatch(/JobDescriptionCreate/);
    expect(apiSchemaContent).toMatch(/JobDescriptionUpdate/);
    expect(apiSchemaContent).toMatch(/AuthResponse/);
  });

  test('auth schema types', () => {
    const loginResponse: schemas['AuthResponse'] = {
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
  });

  test('job description schema types', () => {
    const jobDesc: schemas['JobDescriptionCreate'] = {
      title: 'Software Engineer',
      description: 'Full stack developer position',
      language_code: 'en'
    };

    const jobResponse: schemas['JobDescriptionResponse'] = {
      ...jobDesc,
      id: 1,
      created_at: new Date().toISOString(),
    };

    expect(jobResponse.title).toBe('Software Engineer');
    expect(jobResponse.id).toBe(1);
  });

  test('validation error schema type', () => {
    const error: schemas['HTTPValidationError'] = {
      detail: [{
        loc: ['body', 'email'],
        msg: 'Invalid email format',
        type: 'value_error'
      }]
    };

    expect(error.detail[0].msg).toBe('Invalid email format');
  });

  test('cv generation schema types', () => {
    const request: schemas['GenerateCVRequest'] = {
      cv_text: 'My CV content',
      job_description: 'Job requirements',
      personal_info: {
        full_name: 'John Doe',
        email: {
          value: 'john@example.com',
          type: 'email'
        }
      },
      approved_competences: ['Node.js', 'React'],
      notes: 'Additional notes'
    };

    expect(request.personal_info.full_name).toBe('John Doe');
    expect(request.approved_competences).toHaveLength(2);
  });

  test('cv storage schema types', () => {
    const generatedCV: schemas['GeneratedCVCreate'] = {
      language_code: 'en',
      content: { sections: ['summary', 'experience'] },
      detailed_cv_id: 1,
      job_description_id: 2
    };

    const response: schemas['GeneratedCVResponse'] = {
      ...generatedCV,
      id: 1,
      created_at: new Date().toISOString(),
      user_id: 1
    };

    expect(response.id).toBe(1);
    expect(response.language_code).toBe('en');
  });
});
