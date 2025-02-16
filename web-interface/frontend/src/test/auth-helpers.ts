import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { mockAuthResponse } from './mocks';
import { paths } from '../types/api-schema';
import { API_PATHS, getApiPath } from '../api/api-paths';

const LOGIN_PATH = getApiPath('auth', 'login');
type LoginResponse = paths[typeof LOGIN_PATH]['post']['responses']['200']['content']['application/json'];
type LoginRequest = paths[typeof LOGIN_PATH]['post']['requestBody']['content']['application/x-www-form-urlencoded'];

const getRequestBody = async (request: Request): Promise<LoginRequest> => {
  const text = await request.text();
  const params = new URLSearchParams(text);
  return {
    username: params.get('username') || '',
    password: params.get('password') || ''
  };
};

export const createAuthTestHelpers = () => {
  const waitForLoginComplete = async () => {
    await waitFor(
      () => {
        const button = screen.getByRole('button');
        expect(button).not.toHaveTextContent(/logging in/i);
        expect(button).not.toHaveAttribute('aria-busy', 'true');

        // Check for any errors
        const alert = screen.queryByRole('alert');
        if (alert) {
          throw new Error(`Login failed: ${alert.textContent}`);
        }

        // Verify successful login elements are present
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refresh_token');
        expect(token).toBe(mockAuthResponse.access_token);
        expect(refreshToken).toBe(mockAuthResponse.refresh_token);
      },
      { timeout: 3000, interval: 100 }
    );
  };

const simulateLoginSuccess = (response: LoginResponse = mockAuthResponse) => {
  return http.post(LOGIN_PATH, async ({ request }) => {
    console.log('MSW: Simulating successful login');
    await new Promise(resolve => setTimeout(resolve, 50)); // Longer delay to ensure loading state is testable

    const body = await request.clone().text();
    const formData = new URLSearchParams(body);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    console.log('MSW: Received credentials:', { username: credentials.username });

    return new HttpResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
};

const simulateLoginError = (status: number = 401, message: string = 'Invalid credentials') => {
  return http.post(LOGIN_PATH, async () => {
    console.log('MSW: Simulating login error:', { status, message });
    await new Promise(resolve => setTimeout(resolve, 50)); // Longer delay to ensure loading state is testable
    return new HttpResponse(
      JSON.stringify({ error: message }),
      {
        status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  });
};

const simulateLoginLoading = (delayMs: number = 1000) => {
  return http.post(LOGIN_PATH, async ({ request }) => {
    const body = await request.clone().text();
    const formData = new URLSearchParams(body);
    console.log('MSW: Simulating loading delay:', {
      delayMs,
      username: formData.get('username')
    });

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return new HttpResponse(JSON.stringify(mockAuthResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });
};

  return {
    simulateLoginSuccess,
    simulateLoginError,
    simulateLoginLoading,
    waitForLoginComplete
  };
};
