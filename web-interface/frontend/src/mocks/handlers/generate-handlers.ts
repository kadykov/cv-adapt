import { type OpenAPIV3 } from 'openapi-types';
import { http, HttpResponse, delay } from 'msw';
import { type PathsObject, type Method } from '@/types/api-utils';

interface HandlerOptions {
  validateResponses?: boolean;
  defaultDelay?: number;
}

interface HandlerResponse {
  status?: number;
  message?: string;
  data?: unknown;
}

type HttpMethod = Lowercase<Method>;
interface HandlerDefinition {
  success: (mockData: unknown) => ReturnType<typeof http.get>;
  error: (options: HandlerResponse) => ReturnType<typeof http.get>;
  loading: (options?: { delayMs?: number }) => ReturnType<typeof http.get>;
}

interface PathHandlers {
  [method: string]: HandlerDefinition;
}

interface HandlerGroup {
  [key: string]: HandlerGroup | PathHandlers;
}

/**
 * Generates MSW handlers from OpenAPI specification
 */
export function generateHandlers(
  schema: OpenAPIV3.Document,
  options: HandlerOptions = {}
) {
  const paths = schema.paths as PathsObject;
  const handlers: HandlerGroup = {};

  // Create handler groups by path
  Object.entries(paths).forEach(([path, methods]) => {
    const pathHandlers: PathHandlers = {};

    // Create handlers for each HTTP method
    Object.entries(methods).forEach(([method, operation]) => {
      if (!operation) return;

      const successResponse = operation.responses?.['200'];
      const successSchema = successResponse && 'content' in successResponse
        ? successResponse.content?.['application/json']?.schema
        : undefined;

      pathHandlers[method] = {
        // Success handler
        success: (mockData: unknown) => {
          return http[method.toLowerCase() as HttpMethod](path, async () => {
            if (options.validateResponses && successSchema) {
              validateResponse(mockData, successSchema);
            }

            if (options.defaultDelay) {
              await delay(options.defaultDelay);
            }

            return HttpResponse.json(mockData as Record<string, unknown>, { status: 200 });
          });
        },

        // Error handler
        error: ({ status = 400, message = 'Error' }: HandlerResponse) => {
          return http[method.toLowerCase() as HttpMethod](path, async () => {
            if (options.defaultDelay) {
              await delay(options.defaultDelay);
            }

            return HttpResponse.json({ message }, { status });
          });
        },

        // Loading state handler
        loading: ({ delayMs = 1000 }: { delayMs?: number } = {}) => {
          return http[method.toLowerCase() as HttpMethod](path, async () => {
            await delay(delayMs);
            return new HttpResponse(null, { status: 200 });
          });
        }
      };
    });

    // Add path handlers to main handlers object
    const pathSegments = path.split('/').filter(Boolean);
    let current: HandlerGroup = handlers;
    pathSegments.forEach((segment, index) => {
      if (segment.startsWith('{')) return; // Skip path parameters

      if (index === pathSegments.length - 1) {
        current[segment] = pathHandlers;
      } else {
        current[segment] = current[segment] || {} as HandlerGroup;
        current = current[segment] as HandlerGroup;
      }
    });
  });

  return {
    handlers,
    // Utility to reset all handlers
    reset: () => {
      // Implementation would depend on your MSW setup
      console.log('Resetting all handlers');
    }
  };
}

/**
 * Validates response data against OpenAPI schema
 */
function validateResponse(
  data: unknown,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
) {
  // Implementation would use your preferred validation library
  // For example, you could use Ajv or another JSON Schema validator
  console.log('Validating response against schema', { data, schema });
}

// Example usage:
/*
const { handlers } = generateHandlers(openApiSchema, {
  validateResponses: true,
  delay: 500
});

// Use handlers
handlers.auth.login.success({
  access_token: 'token',
  user: { id: 1 }
});

handlers.auth.login.error({
  status: 401,
  message: 'Invalid credentials'
});

handlers.auth.login.loading({
  delay: 2000
});
*/
