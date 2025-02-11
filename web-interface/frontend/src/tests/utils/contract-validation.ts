import { z } from 'zod';
import type { OpenAPIV3 } from 'openapi-types';
import openApiSchema from '../../api/openapi.json';

// Type assertion to help TypeScript understand the structure
export const schema = openApiSchema as OpenAPIV3.Document;
const paths = schema.paths as Record<string, Record<string, OpenAPIV3.OperationObject>>;

// Type guard for OpenAPI Response Object
function isResponseObject(obj: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): obj is OpenAPIV3.ResponseObject {
  return 'content' in obj;
}

// Reusable validation helper
export async function validateResponse<T extends object>(
  response: Response,
  path: string,
  method: string,
  statusCode: number,
  zodSchema: z.ZodType<T>
): Promise<T> {
  // Convert URL path parameters to OpenAPI format (e.g., /jobs/1 -> /jobs/{job_id})
  const pathPattern = Object.keys(paths).find(pattern => {
    const regexPattern = pattern
      .replace(/\{[^/}]+\}/g, '[^/]+') // Replace {param} with regex pattern
      .replace(/\//g, '\\/'); // Escape forward slashes
    return new RegExp(`^${regexPattern}$`).test(path);
  });

  if (!pathPattern) {
    throw new Error(`No schema found for path ${path}`);
  }

  const pathSchema = paths[pathPattern][method.toLowerCase()];
  if (!pathSchema) {
    throw new Error(`No schema found for ${method} ${path}`);
  }

  // Get response schema for this status code
  const response200 = pathSchema.responses[statusCode.toString()];
  if (!response200) {
    throw new Error(`No response definition found for ${method} ${path} ${statusCode}`);
  }

  if (!isResponseObject(response200)) {
    throw new Error(`Response for ${method} ${path} ${statusCode} is a reference, not an inline definition`);
  }

  const responseSchema = response200.content?.['application/json']?.schema;
  if (!responseSchema) {
    throw new Error(`No JSON schema found for ${method} ${path} ${statusCode}`);
  }

  // Verify response status
  if (response.status !== statusCode) {
    throw new Error(`Expected status ${statusCode} but got ${response.status}`);
  }

  // Parse and validate response data
  const data = await response.json();
  return zodSchema.parse(data);
}

// Common Zod schemas based on contract test definitions
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  language_code: z.string(),
  created_at: z.string()
});

export const jobListSchema = z.array(jobSchema);
