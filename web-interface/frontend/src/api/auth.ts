import { paths } from '../types/api-schema';
import { client } from './client';
import { API_PATHS, getApiPath } from './api-paths';

const LOGIN_PATH = getApiPath('auth', 'login');
const LOGOUT_PATH = getApiPath('auth', 'logout');
const REFRESH_PATH = getApiPath('auth', 'refresh');

export type LoginRequest = paths[typeof LOGIN_PATH]['post']['requestBody']['content']['application/x-www-form-urlencoded'];
export type LoginResponse = paths[typeof LOGIN_PATH]['post']['responses']['200']['content']['application/json'];

export class AuthService {
  async login({ username, password }: LoginRequest): Promise<LoginResponse> {
    console.log('Auth API login called with:', { username });

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await client.post(LOGIN_PATH, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log('Auth API login succeeded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Auth API login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await client.post(LOGOUT_PATH);
  }

  async refreshToken(token: string): Promise<LoginResponse> {
    const params = new URLSearchParams();
    params.append('token', token);
    const response = await client.post(REFRESH_PATH, params);
    return response.data;
  }
}

export const authService = new AuthService();
