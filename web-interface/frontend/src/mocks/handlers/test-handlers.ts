import { HttpResponse, http, delay } from 'msw';
import { getApiPath } from '@/api/api-paths';
import type { components } from '@/types/api-schema';

const defaultAuthResponse: components['schemas']['AuthResponse'] = {
  access_token: 'default_token',
  refresh_token: 'default_refresh',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: {}
  }
};

type RequestState = 'success' | 'error' | 'loading';
let currentState: RequestState = 'success';
let responseDelay = 0;
let mockResponse: any = defaultAuthResponse;
let errorStatus = 401;
let errorMessage = 'Invalid credentials';

export const handlers = {
  auth: {
    login: http.post(getApiPath('auth', 'login'), async () => {
      if (responseDelay) {
        await delay(responseDelay);
      }

      switch (currentState) {
        case 'loading':
          return new Response(null, {
            status: 102,
            statusText: 'Processing'
          });

        case 'error':
          return new Response(
            JSON.stringify({ message: errorMessage }),
            {
              status: errorStatus,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

        default:
          return HttpResponse.json(mockResponse);
      }
    })
  }
};

export const setRequestState = (
  state: RequestState,
  options?: {
    delay?: number;
    response?: any;
    errorStatus?: number;
    errorMessage?: string;
  }
) => {
  currentState = state;
  responseDelay = options?.delay ?? 0;
  mockResponse = options?.response ?? defaultAuthResponse;
  errorStatus = options?.errorStatus ?? 401;
  errorMessage = options?.errorMessage ?? 'Invalid credentials';
};
