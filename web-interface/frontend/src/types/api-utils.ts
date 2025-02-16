
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
}
