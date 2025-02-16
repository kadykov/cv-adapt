import { z } from 'zod';
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
};
