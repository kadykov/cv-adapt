import { expect, describe, test, beforeAll } from 'vitest';
import type { OpenAPIV3 } from 'openapi-types';
import { z } from 'zod';
import openApiSchema from '../api/openapi.json';

const schema = openApiSchema as OpenAPIV3.Document;

describe('API Contract Tests', () => {
  beforeAll(() => {
    // Validate OpenAPI schema format
    expect(schema.openapi).toBeDefined();
    expect(schema.paths).toBeDefined();
    expect(schema.components?.schemas).toBeDefined();
  });

  // Helper to validate response against schema
  async function validateResponse<T extends object>(
    response: Response,
    path: string,
    method: string,
    statusCode: number,
    zodSchema: z.ZodType<T>
  ) {
    expect(response.status).toBe(statusCode);

    // Get OpenAPI schema for this endpoint
    const pathSchema = openApiSchema.paths[path]?.[method.toLowerCase()];
    expect(pathSchema).toBeDefined();

    // Get response schema for this status code
    const responseSchema = pathSchema?.responses[statusCode]?.content?.['application/json']?.schema;
    expect(responseSchema).toBeDefined();

    // Parse and validate response data
    const data = await response.json();
    expect(() => zodSchema.parse(data)).not.toThrow();

    return data as T;
  }

  describe('Auth Endpoints', () => {
    test('POST /v1/auth/register', async () => {
      const response = await fetch('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const data = await validateResponse(
        response,
        '/v1/auth/register',
        'POST',
        200,
        z.object({
          access_token: z.string(),
          refresh_token: z.string(),
          token_type: z.literal('bearer'),
          user: z.object({
            id: z.number(),
            email: z.string(),
            created_at: z.string()
          })
        })
      );

      expect(data).toMatchObject({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        token_type: 'bearer',
        user: {
          id: expect.any(Number),
          email: expect.any(String),
          created_at: expect.any(String)
        }
      });
    });

    test('POST /v1/auth/login', async () => {
      const response = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: 'test@example.com',
          password: 'password123'
        })
      });

      await validateResponse(
        response,
        '/v1/auth/login',
        'POST',
        200,
        z.object({
          access_token: z.string(),
          refresh_token: z.string(),
          token_type: z.literal('bearer'),
          user: z.object({
            id: z.number(),
            email: z.string(),
            created_at: z.string()
          })
        })
      );
    });

    test('POST /v1/auth/refresh', async () => {
      const response = await fetch('/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'mock_refresh_token' })
      });

      await validateResponse(
        response,
        '/v1/auth/refresh',
        'POST',
        200,
        z.object({
          access_token: z.string(),
          refresh_token: z.string(),
          token_type: z.literal('bearer'),
          user: z.object({
            id: z.number(),
            email: z.string(),
            created_at: z.string()
          })
        })
      );
    });
  });

  describe('User Profile Endpoints', () => {
    test('GET /user/profile', async () => {
      const response = await fetch('/user/profile');
      await validateResponse(
        response,
        '/user/profile',
        'GET',
        200,
        z.object({
          id: z.number(),
          email: z.string(),
          created_at: z.string()
        })
      );
    });

    test('PUT /user/profile', async () => {
      const response = await fetch('/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal_info: {
            full_name: 'John Doe',
            email: { value: 'john@example.com', type: 'email' }
          }
        })
      });

      await validateResponse(
        response,
        '/user/profile',
        'PUT',
        200,
        z.object({
          id: z.number(),
          email: z.string(),
          created_at: z.string(),
          personal_info: z.object({
            full_name: z.string(),
            email: z.object({
              value: z.string(),
              type: z.literal('email')
            })
          })
        })
      );
    });
  });

  describe('CV Endpoints', () => {
    test('GET /user/detailed-cvs', async () => {
      const response = await fetch('/user/detailed-cvs');
      await validateResponse(
        response,
        '/user/detailed-cvs',
        'GET',
        200,
        z.array(
          z.object({
            id: z.number(),
            user_id: z.number(),
            language_code: z.string(),
            content: z.record(z.any()),
            created_at: z.string()
          })
        )
      );
    });

    test('CV CRUD operations', async () => {
      // Create/Update CV
      const putResponse = await fetch('/user/detailed-cvs/en', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_code: 'en',
          content: { summary: 'Test summary' },
          is_primary: false
        })
      });
      await validateResponse(
        putResponse,
        '/user/detailed-cvs/{language_code}',
        'PUT',
        200,
        z.object({
          id: z.number(),
          user_id: z.number(),
          language_code: z.string(),
          content: z.record(z.any()),
          created_at: z.string(),
          is_primary: z.boolean()
        })
      );

      // Get CV
      const getResponse = await fetch('/user/detailed-cvs/en');
      await validateResponse(
        getResponse,
        '/user/detailed-cvs/{language_code}',
        'GET',
        200,
        z.object({
          id: z.number(),
          user_id: z.number(),
          language_code: z.string(),
          content: z.record(z.any()),
          created_at: z.string(),
          is_primary: z.boolean()
        })
      );

      // Delete CV
      const deleteResponse = await fetch('/user/detailed-cvs/en', {
        method: 'DELETE'
      });
      expect(deleteResponse.status).toBe(204);
    });
  });

  describe('Jobs Endpoints', () => {
    test('GET /jobs', async () => {
      const response = await fetch('/jobs');
      await validateResponse(
        response,
        '/jobs',
        'GET',
        200,
        z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            description: z.string(),
            language_code: z.string(),
            created_at: z.string()
          })
        )
      );
    });

    test('Job CRUD operations', async () => {
      // Create job
      const createResponse = await fetch('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Software Engineer',
          description: 'Test description',
          language_code: 'en'
        })
      });
      const job = await validateResponse(
        createResponse,
        '/jobs',
        'POST',
        200,
        z.object({
          id: z.number(),
          title: z.string(),
          description: z.string(),
          language_code: z.string(),
          created_at: z.string()
        })
      );

      // Get job
      const getResponse = await fetch(`/jobs/${job.id}`);
      await validateResponse(
        getResponse,
        '/jobs/{job_id}',
        'GET',
        200,
        z.object({
          id: z.number(),
          title: z.string(),
          description: z.string(),
          language_code: z.string(),
          created_at: z.string()
        })
      );

      // Update job
      const updateResponse = await fetch(`/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Senior Software Engineer'
        })
      });
      await validateResponse(
        updateResponse,
        '/jobs/{job_id}',
        'PUT',
        200,
        z.object({
          id: z.number(),
          title: z.string(),
          description: z.string(),
          language_code: z.string(),
          created_at: z.string()
        })
      );

      // Delete job
      const deleteResponse = await fetch(`/jobs/${job.id}`, {
        method: 'DELETE'
      });
      expect(deleteResponse.status).toBe(204);
    });
  });

  describe('Generation Endpoints', () => {
    test('POST /api/generate-competences', async () => {
      const response = await fetch('/api/generate-competences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_text: 'Test CV',
          job_description: 'Test job'
        })
      });

      await validateResponse(
        response,
        '/api/generate-competences',
        'POST',
        200,
        z.object({
          technical: z.array(z.string()),
          soft: z.array(z.string())
        })
      );
    });

    test('Generation workflow', async () => {
      // Generate CV
      const generateResponse = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_code: 'en',
          content: { summary: 'Generated summary' },
          detailed_cv_id: 1,
          job_description_id: 1
        })
      });

      const generated = await validateResponse(
        generateResponse,
        '/generate',
        'POST',
        200,
        z.object({
          id: z.number(),
          user_id: z.number(),
          language_code: z.string(),
          content: z.record(z.any()),
          created_at: z.string()
        })
      );

      // Get all generations
      const listResponse = await fetch('/generations');
      await validateResponse(
        listResponse,
        '/generations',
        'GET',
        200,
        z.array(
          z.object({
            id: z.number(),
            user_id: z.number(),
            language_code: z.string(),
            content: z.record(z.any()),
            created_at: z.string()
          })
        )
      );

      // Get specific generation
      const getResponse = await fetch(`/generations/${generated.id}`);
      await validateResponse(
        getResponse,
        '/generations/{cv_id}',
        'GET',
        200,
        z.object({
          id: z.number(),
          user_id: z.number(),
          language_code: z.string(),
          content: z.record(z.any()),
          created_at: z.string()
        })
      );
    });
  });
});
