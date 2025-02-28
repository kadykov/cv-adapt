import { components } from '../../api/types';
import { http, HttpResponse } from 'msw';
import { getTestApiUrl } from '../url-helper';

type Schema = components['schemas'];

/**
 * Creates an MSW handler for GET endpoints that returns schema-validated data
 */
export function createGetHandler<T extends keyof Schema>(
  path: string,
  _schemaKey: T, // Used only for type inference
  responseData: Schema[T] | Schema[T][] | null,
  options?: { status?: number },
) {
  return http.get(getTestApiUrl(path), () => {
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
  },
) {
  return http.post(getTestApiUrl(path), async ({ request }) => {
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
  },
) {
  return http.put(getTestApiUrl(path), async ({ request }) => {
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
 * Creates an MSW handler for DELETE endpoints
 */
export function createDeleteHandler(path: string) {
  return http.delete(getTestApiUrl(path), () => {
    return new HttpResponse(null, { status: 204 });
  });
}
