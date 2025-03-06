import {
  createFormPostHandler,
  createPostHandler,
  createGetHandler,
  createEmptyResponseHandler,
} from '../../../lib/test/integration/handler-generator';
import { mockUser, mockAuthResponse } from './fixtures';

export { mockUser, mockAuthResponse };

export const authIntegrationHandlers = [
  createFormPostHandler(
    'auth/login',
    'Body_login_v1_api_auth_login_post',
    'AuthResponse',
    mockAuthResponse,
    {
      transformRequest: (formData) => {
        // Transform email to username as expected by the API
        const email = formData.get('email');
        const password = formData.get('password');

        const transformed = new URLSearchParams({
          username: email ?? '',
          password: password ?? '',
          grant_type: 'password',
          scope: '',
        });

        return transformed;
      },
      validateRequest: (transformedData) => {
        const username = transformedData.get('username');
        const password = transformedData.get('password');
        const valid =
          username === 'test@example.com' && password === 'password123';

        return valid;
      },
      errorResponse: {
        status: 401,
        message: 'Invalid credentials',
      },
    },
  ),

  createPostHandler(
    'auth/refresh',
    'Body_refresh_token_v1_api_auth_refresh_post',
    'AuthResponse',
    mockAuthResponse,
  ),

  createEmptyResponseHandler('post', 'auth/logout', { status: 204 }),

  createGetHandler('users/me', 'UserResponse', mockUser),
];
