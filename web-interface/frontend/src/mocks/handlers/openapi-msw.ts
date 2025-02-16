import { createOpenApiHttp } from 'openapi-msw';
import type { paths } from '../../types/api-utils';
import { HttpResponse, type JsonBodyType } from 'msw';

// Create type-safe http object
const http = createOpenApiHttp<paths>({ baseUrl: '/api' });

// Helper to create success response with type checking
function createSuccessResponse<T extends JsonBodyType>(data: T): HttpResponse {
  return HttpResponse.json(data);
}

// Helper to create error response
function createErrorResponse(status: number, message: string): HttpResponse {
  return new HttpResponse(
    JSON.stringify({ message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Helper to create loading response
function createLoadingResponse(delayMs: number = 1000): Promise<HttpResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new HttpResponse(null, { status: 200 }));
    }, delayMs);
  });
}

// Export the enhanced http object and helpers
export const handlers = {
  http,
  createSuccessResponse,
  createErrorResponse,
  createLoadingResponse,
};
