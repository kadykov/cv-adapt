import type { schemas } from '@/types/api-schema';
type ValidationError = schemas['ValidationError'];

/**
 * Custom API error class to handle API-specific error cases
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }

  /**
   * Create an ApiError instance from a Response object
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let message = 'An unexpected error occurred';

    try {
      const data = await response.json();
      if (data) {
        if (typeof data.detail === 'string') {
          // Handle 404 responses
          message = data.detail;
        } else if (data.detail?.message) {
          // Handle 401 responses
          message = data.detail.message;
        } else if (Array.isArray(data.detail)) {
          // Handle 422 validation errors
          message = data.detail.map((err: ValidationError) => err.msg).join(', ');
        }
      }
    } catch {
      // If response is not JSON or has no message, use default message
    }

    return new ApiError(response.status, message);
  }

  /**
   * Check if the error is an unauthorized error (401)
   */
  isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Check if the error is a forbidden error (403)
   */
  isForbidden(): boolean {
    return this.status === 403;
  }

  /**
   * Check if the error is a not found error (404)
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if the error is a validation error (422)
   */
  isValidationError(): boolean {
    return this.status === 422;
  }

  /**
   * Check if the error is a server error (500+)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}
