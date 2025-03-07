import { components } from '../../api/types';
import { http, HttpResponse } from 'msw';
import { getTestApiUrl } from '../url-helper';

type Schema = components['schemas'];
type HttpMethod = 'get' | 'post' | 'put' | 'delete';

/**
 * Default delays for different operation types (in milliseconds)
 */
const HANDLER_DELAYS = {
  BASE: 100,
  GET_LIST: 100, // Same as base for listing operations
  GET_SINGLE: 100, // Same as base for getting single items
  CREATE: 150, // 1.5x base for create operations
  UPDATE: 150, // 1.5x base for update operations
  DELETE: 120, // 1.2x base for delete operations
  ERROR: 100, // Same as base for error responses
} as const;

type HandlerOperationType = keyof typeof HANDLER_DELAYS;

/**
 * Helper function to handle delays consistently across handlers
 */
async function applyHandlerDelay(
  operationType: HandlerOperationType,
  customDelay?: number,
) {
  const delay = customDelay ?? HANDLER_DELAYS[operationType];
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Creates an MSW handler for GET endpoints that returns schema-validated data
 */
export function createGetHandler<T extends keyof Schema>(
  path: string,
  _schemaKey: T, // Used only for type inference
  responseData: Schema[T] | Schema[T][] | null,
  options?: { status?: number; delay?: number },
) {
  return http.get(getTestApiUrl(path), async () => {
    // Apply delay based on whether it's a list or single item operation
    const operationType = Array.isArray(responseData)
      ? 'GET_LIST'
      : 'GET_SINGLE';
    await applyHandlerDelay(operationType, options?.delay);

    if (!responseData) {
      return new HttpResponse(null, { status: options?.status || 500 });
    }
    return HttpResponse.json(responseData);
  });
}

/**
 * Creates an MSW handler for POST endpoints that validates request and response against schema
 */
export function createPostHandler<
  T extends keyof Schema,
  R extends keyof Schema,
>(
  path: string,
  _requestSchemaKey: T, // Used only for type inference
  _responseSchemaKey: R, // Used only for type inference
  responseData: Schema[R],
  options?: {
    validateRequest?: (req: Schema[T]) => boolean;
    errorResponse?: { status: number; message: string };
    delay?: number;
  },
) {
  return http.post(getTestApiUrl(path), async ({ request }) => {
    await applyHandlerDelay('CREATE', options?.delay);
    const body = (await request.json()) as Schema[T];

    if (options?.validateRequest && !options.validateRequest(body)) {
      const error = options.errorResponse || {
        status: 400,
        message: 'Invalid request',
      };
      return new HttpResponse(null, {
        status: error.status,
        statusText: error.message,
      });
    }

    return HttpResponse.json(responseData);
  });
}

/**
 * Creates an MSW handler for POST endpoints that expect form data and validate against schema
 */
export function createFormPostHandler<
  T extends keyof Schema,
  R extends keyof Schema,
>(
  path: string,
  _requestSchemaKey: T, // Used only for type inference
  _responseSchemaKey: R, // Used only for type inference
  responseData: Schema[R],
  options?: {
    transformRequest?: (formData: URLSearchParams) => URLSearchParams;
    validateRequest?: (transformedData: URLSearchParams) => boolean;
    errorResponse?: { status: number; message: string };
    delay?: number;
  },
) {
  return http.post(getTestApiUrl(path), async ({ request }) => {
    await applyHandlerDelay('CREATE', options?.delay);
    const formData = new URLSearchParams(await request.text());
    const transformedData = options?.transformRequest
      ? options.transformRequest(formData)
      : formData;
    if (options?.validateRequest && !options.validateRequest(transformedData)) {
      const error = options.errorResponse || {
        status: 400,
        message: 'Invalid request',
      };
      return new HttpResponse(null, {
        status: error.status,
        statusText: error.message,
      });
    }
    return HttpResponse.json(responseData);
  });
}

/**
 * Creates an MSW handler for PUT endpoints that validates request and response against schema
 */
export function createPutHandler<
  T extends keyof Schema,
  R extends keyof Schema,
>(
  path: string,
  _requestSchemaKey: T, // Used only for type inference
  _responseSchemaKey: R, // Used only for type inference
  responseData: Schema[R],
  options?: {
    validateRequest?: (req: Schema[T]) => boolean;
    errorResponse?: { status: number; message: string };
    delay?: number;
  },
) {
  return http.put(getTestApiUrl(path), async ({ request }) => {
    await applyHandlerDelay('UPDATE', options?.delay);
    const body = (await request.json()) as Schema[T];

    if (options?.validateRequest && !options.validateRequest(body)) {
      const error = options.errorResponse || {
        status: 400,
        message: 'Invalid request',
      };
      return new HttpResponse(null, {
        status: error.status,
        statusText: error.message,
      });
    }

    return HttpResponse.json(responseData);
  });
}

/**
 * Creates an MSW handler for endpoints that have no request/response body and return only a status code
 */
export function createEmptyResponseHandler(
  method: HttpMethod,
  path: string,
  options?: { status?: number; delay?: number },
) {
  const httpMethod = http[method];
  return httpMethod(getTestApiUrl(path), async () => {
    await applyHandlerDelay('BASE', options?.delay);
    return new HttpResponse(null, { status: options?.status ?? 204 });
  });
}

/**
 * Creates an MSW handler for DELETE endpoints
 */
export function createDeleteHandler(
  path: string,
  options?: { status?: number; delay?: number },
) {
  return createEmptyResponseHandler('delete', path, {
    status: 204,
    ...options,
  });
}

/**
 * Creates an MSW handler for error responses that match the API error schema
 */
export function createErrorHandler(
  path: string,
  status: number,
  error: { detail: { message: string } },
  options?: { status?: number; delay?: number },
) {
  return http.get(getTestApiUrl(path), async () => {
    await applyHandlerDelay('ERROR', options?.delay);
    return HttpResponse.json(error, { status });
  });
}
