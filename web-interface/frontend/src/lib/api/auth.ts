import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from './generated-types';
import { client } from './client';

export const authApi = {
  /**
   * Login with email and password
   */
  login: (data: LoginRequest): Promise<AuthResponse> =>
    client.post<AuthResponse>('/auth/login', data),

  /**
   * Register a new user
   */
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    client.post<AuthResponse>('/auth/register', data),

  /**
   * Refresh the access token using a refresh token
   */
  refresh: (data: { token: string }): Promise<AuthResponse> =>
    client.post<AuthResponse>('/auth/refresh', data),

  /**
   * Get current user profile
   */
  getProfile: (): Promise<User> => client.get<User>('/users/me'),

  /**
   * Logout the current user
   */
  logout: () => client.post<void>('/auth/logout', {}),
};
