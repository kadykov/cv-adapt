import { components } from '../../api/types';
import { http, HttpResponse } from 'msw';

type Schema = components['schemas'];

/**
 * Creates an MSW handler for GET endpoints that returns schema-validated data
 */
export function createGetHandler<T extends keyof Schema>(
  path: string,
  _schemaKey: T, // Keep parameter for type inference but mark as unused
  responseData: Schema[T] | Schema[T][] | null,
  options?: { status?: number },
) {
  return http.get(path, () => {
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
  _requestSchema: T, // Keep parameter for type inference but mark as unused
  _responseSchema: R, // Keep parameter for type inference but mark as unused
  responseData: Schema[R],
) {
  return http.post(path, () => {
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
  _requestSchema: T, // Keep parameter for type inference but mark as unused
  _responseSchema: R, // Keep parameter for type inference but mark as unused
  responseData: Schema[R],
) {
  return http.put(path, () => {
    return HttpResponse.json(responseData);
  });
}

/**
 * Creates an MSW handler for DELETE endpoints
 */
export function createDeleteHandler(path: string) {
  return http.delete(path, () => {
    return new HttpResponse(null, { status: 204 });
  });
}
