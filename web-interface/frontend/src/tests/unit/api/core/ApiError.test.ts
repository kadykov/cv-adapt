import { describe, it, expect } from 'vitest';
import { ApiError } from '@/api/core/ApiError';
import { createErrorResponse } from '../../../test-utils';

describe('ApiError', () => {
  it('should create an error from API error response', async () => {
    const status = 400;
    const message = 'Bad Request';
    const response = createErrorResponse(status, message);

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('should create an error with default message if response has no message', async () => {
    const status = 500;
    const response = new Response(null, { status });

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.status).toBe(status);
  });

  it('should handle non-JSON error responses', async () => {
    const status = 502;
    const response = new Response('Bad Gateway', { status });

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.status).toBe(status);
  });

  it('should create an error with custom message', () => {
    const status = 404;
    const message = 'Resource not found';
    const error = new ApiError(status, message);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('should handle unauthorized errors', async () => {
    const status = 401;
    const message = 'Unauthorized';
    const response = createErrorResponse(status, message);

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.isUnauthorized()).toBe(true);
  });

  it('should handle forbidden errors', async () => {
    const status = 403;
    const message = 'Forbidden';
    const response = createErrorResponse(status, message);

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.isForbidden()).toBe(true);
  });

  it('should handle not found errors', async () => {
    const status = 404;
    const message = 'Not Found';
    const response = createErrorResponse(status, message);

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.isNotFound()).toBe(true);
  });

  it('should handle validation errors', async () => {
    const status = 422;
    const message = 'Validation Error';
    const response = createErrorResponse(status, message);

    const error = await ApiError.fromResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.isValidationError()).toBe(true);
  });
});
