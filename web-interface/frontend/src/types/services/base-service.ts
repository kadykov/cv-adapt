
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
}
