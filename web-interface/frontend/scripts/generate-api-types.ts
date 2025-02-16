#!/usr/bin/env node
import { generateZodClientFromOpenAPI } from 'openapi-zod-client';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTypes() {
  try {
    console.log('Reading OpenAPI schema...');
    const schemaPath = path.resolve(__dirname, '../src/api/openapi.json');
    const typesDir = path.resolve(__dirname, '../src/types');
    const schema = JSON.parse(
      await fs.readFile(schemaPath, 'utf-8')
    );

    // Create types directory if it doesn't exist
    await fs.mkdir(typesDir, { recursive: true });

    console.log('Generating TypeScript types...');
    // Generate base types using openapi-typescript
    const typesOutput = execSync(`npx openapi-typescript ${schemaPath}`).toString();
    await fs.writeFile(
      path.resolve(typesDir, 'api-schema.ts'),
      typesOutput
    );

    console.log('Generating Zod schemas and client...');
    // Generate Zod schemas and client with service classes
    const output = await generateZodClientFromOpenAPI({
      openApiDoc: schema,
      distPath: path.resolve(typesDir, 'api-client.ts'),
      options: {
        baseUrl: '/api/v1',
        withAlias: true,
        apiClientName: 'ApiClient',
        shouldExportClient: true,
        defaultStatusBehavior: "auto-correct"
      }
    });

    // Create services directory
    const servicesDir = path.resolve(typesDir, 'services');
    await fs.mkdir(servicesDir, { recursive: true });

    // Generate base service class
    const baseServiceContent = `
import { z } from 'zod';
import { ApiClient } from '../api-client';
import type { ApiResponse, ApiError } from '../api-utils';
import { schemas } from '../zod-schemas';

export class BaseService {
  constructor(protected client = new ApiClient()) {}

  protected handleError(error: unknown): never {
    const apiError: ApiError = {
      error: {
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
    throw apiError;
  }

  protected validate<T>(schema: z.ZodType<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      return this.handleError(error);
    }
  }
}`;
    await fs.writeFile(
      path.resolve(servicesDir, 'base-service.ts'),
      baseServiceContent
    );

    // Generate CV service
    const cvServiceContent = `
import { z } from 'zod';
import { BaseService } from './base-service';
import type { ApiResponse } from '../api-utils';
import { schemas } from '../zod-schemas';

export class DetailedCVService extends BaseService {
  /**
   * Get all user's detailed CVs
   */
  async getAllDetailedCVs(): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>[]>> {
    try {
      const response = await this.client['/user/detailed-cvs'].get();
      return {
        data: this.validate(z.array(schemas.DetailedCVResponse), response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's detailed CV by language
   */
  async getDetailedCVByLanguage(languageCode: string): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code'].get({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create or update user's detailed CV for a language
   */
  async upsertDetailedCV(
    languageCode: string,
    cv: z.infer<typeof schemas.DetailedCVCreate>
  ): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code'].put({
        params: { language_code: languageCode },
        body: cv
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete user's detailed CV by language
   */
  async deleteDetailedCV(languageCode: string): Promise<void> {
    try {
      await this.client['/user/detailed-cvs/:language_code'].delete({
        params: { language_code: languageCode }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Set a CV as primary
   */
  async setPrimaryCv(languageCode: string): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code/primary'].put({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}`;
    await fs.writeFile(
      path.resolve(servicesDir, 'cv-service.ts'),
      cvServiceContent
    );

    // Generate Job service
    const jobServiceContent = `
import { z } from 'zod';
import { BaseService } from './base-service';
import type { ApiResponse } from '../api-utils';
import { schemas } from '../zod-schemas';

export class JobService extends BaseService {
  /**
   * Get all job descriptions for a language
   */
  async getJobs(languageCode: string = 'en'): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>[]>> {
    try {
      const response = await this.client['/jobs'].get({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(z.array(schemas.JobDescriptionResponse), response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create new job description
   */
  async createJob(job: z.infer<typeof schemas.JobDescriptionCreate>): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs'].post({
        body: job
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get job description by ID
   */
  async getJobById(jobId: number): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs/:job_id'].get({
        params: { job_id: jobId }
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update job description
   */
  async updateJob(
    jobId: number,
    job: z.infer<typeof schemas.JobDescriptionUpdate>
  ): Promise<ApiResponse<z.infer<typeof schemas.JobDescriptionResponse>>> {
    try {
      const response = await this.client['/jobs/:job_id'].put({
        params: { job_id: jobId },
        body: job
      });
      return {
        data: this.validate(schemas.JobDescriptionResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete job description
   */
  async deleteJob(jobId: number): Promise<void> {
    try {
      await this.client['/jobs/:job_id'].delete({
        params: { job_id: jobId }
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}`;
    await fs.writeFile(
      path.resolve(servicesDir, 'job-service.ts'),
      jobServiceContent
    );

    // Extract schemas from output
    const schemas = output.split('export const schemas = ')[1].split('export const')[0].trim();

    // Write Zod schemas
    await fs.writeFile(
      path.resolve(typesDir, 'zod-schemas.ts'),
      `import { z } from 'zod';
import type { components } from './api-schema';
import { schemas as apiSchemas } from './api-client';

export const schemas = apiSchemas;

// Generate path-specific request/response schemas
export const pathSchemas = Object.entries(schemas).reduce((acc, [key, schema]) => {
  const [path, method, type] = key.split(':');
  if (!acc[path]) acc[path] = {};
  if (!acc[path][method]) acc[path][method] = {};
  acc[path][method][type] = schema;
  return acc;
}, {} as Record<string, Record<string, Record<'request' | 'response', z.ZodType>>>);

// Schema factory functions for mock data
export function createMockDataFactory<T extends z.ZodType>(schema: T) {
  return (overrides?: Partial<z.infer<T>>) => {
    const base = schema.parse({});
    return { ...base, ...overrides };
  };
}

// Common error schemas
export const errorSchemas = {
  validation: z.object({
    detail: z.array(z.object({
      loc: z.array(z.string()),
      msg: z.string(),
      type: z.string()
    }))
  }),
  unauthorized: z.object({
    detail: z.object({
      message: z.string()
    })
  }),
  notFound: z.object({
    detail: z.string()
  })
};`
    );

    // Generate utility types
    const utilityTypes = `
import type { components } from './api-schema';
import type { z } from 'zod';
import { pathSchemas } from './zod-schemas';

export type paths = components['paths'];
export type schemas = components['schemas'];
export type operations = components['operations'];

export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type ApiError = {
  error: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type PathParams<T extends keyof paths> = paths[T] extends {
  parameters: { path: infer P };
}
  ? P
  : never;

export type QueryParams<T extends keyof paths> = paths[T] extends {
  parameters: { query: infer Q };
}
  ? Q
  : never;

export type RequestBody<
  T extends keyof paths,
  M extends keyof paths[T]
> = paths[T][M] extends {
  requestBody: {
    content: {
      'application/json': infer B;
    };
  };
}
  ? B
  : never;

export type ResponseBody<
  T extends keyof paths,
  M extends keyof paths[T],
  Status extends number = 200
> = paths[T][M] extends {
  responses: {
    [S in Status]: {
      content: {
        'application/json': infer R;
      };
    };
  };
}
  ? R
  : never;

export type PathSchema<
  T extends keyof paths,
  M extends keyof paths[T]
> = {
  request: z.ZodType<RequestBody<T, M>>;
  response: z.ZodType<ResponseBody<T, M>>;
};

export type HandlerScenario = 'success' | 'error' | 'loading';

export interface HandlerConfig<T extends keyof paths, M extends keyof paths[T]> {
  path: T;
  method: M;
  scenario?: HandlerScenario;
  mockData: ResponseBody<T, M>;
  status?: number;
}`;

    await fs.writeFile(
      path.resolve(typesDir, 'api-utils.ts'),
      utilityTypes
    );

    console.log('Successfully generated:');
    console.log('- src/types/api-schema.ts');
    console.log('- src/types/zod-schemas.ts');
    console.log('- src/types/api-client.ts');
    console.log('- src/types/api-utils.ts');
    console.log('- src/types/services/base-service.ts');
    console.log('- src/types/services/cv-service.ts');
    console.log('- src/types/services/job-service.ts');

  } catch (error) {
    console.error('Error generating TypeScript types:', error);
    process.exit(1);
  }
}

generateTypes();
