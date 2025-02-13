#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTypes() {
  try {
    // Define paths
    const schemaPath = path.resolve(__dirname, '../src/api/openapi.json');
    const outputPath = path.resolve(__dirname, '../src/types/api-schema.ts');

    // Generate base types using openapi-typescript CLI
    console.log('Generating TypeScript types from schema');
    const generatedTypes = execSync(`npx openapi-typescript ${schemaPath}`).toString();

    // Create the final output with additional utility types
    const finalOutput = `${generatedTypes}

export type paths = components['paths'];
export type schemas = components['schemas'];
export type operations = components['operations'];

// Utility types for API requests and responses
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

// Helper type to extract path parameters from paths
export type PathParams<T extends keyof paths> = paths[T] extends {
  parameters: { path: infer P };
}
  ? P
  : never;

// Helper type to extract query parameters from paths
export type QueryParams<T extends keyof paths> = paths[T] extends {
  parameters: { query: infer Q };
}
  ? Q
  : never;

// Helper type to extract request body from paths
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

// Helper type to extract response body from paths
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
`;

    // Write the final output
    await fs.writeFile(outputPath, finalOutput);
    console.log('TypeScript types generated successfully at:', outputPath);

  } catch (error) {
    console.error('Error generating TypeScript types:', error);
    process.exit(1);
  }
}

generateTypes();
