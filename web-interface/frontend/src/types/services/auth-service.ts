import { z } from 'zod';
import { BaseService } from './base-service';
import type { ApiResponse } from '../api-utils';
import { schemas } from '../zod-schemas';

export class AuthService extends BaseService {
  /**
   * Login user and get access token
   */
  async login(email: string, password: string): Promise<ApiResponse<z.infer<typeof schemas.AuthResponse>>> {
    try {
      const response = await this.client['/v1/api/auth/login'].post({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: email, // API expects username field but we use email
          password,
          grant_type: 'password'
        })
      });

      const validatedResponse = schemas.AuthResponse.parse(response);
      return {
        data: validatedResponse,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Register a new user
   */
  async register(data: z.infer<typeof schemas.UserCreate>): Promise<ApiResponse<z.infer<typeof schemas.AuthResponse>>> {
    try {
      const validatedData = schemas.UserCreate.parse(data);
      const response = await this.client['/v1/api/auth/register'].post({
        body: validatedData
      });

      const validatedResponse = schemas.AuthResponse.parse(response);
      return {
        data: validatedResponse,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.client['/v1/api/auth/logout'].post();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string): Promise<ApiResponse<z.infer<typeof schemas.AuthResponse>>> {
    try {
      const response = await this.client['/v1/api/auth/refresh'].post({
        body: { token }
      });

      const validatedResponse = schemas.AuthResponse.parse(response);
      return {
        data: validatedResponse,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Test if current token is valid
   */
  async testToken(): Promise<ApiResponse<z.infer<typeof schemas.UserResponse>>> {
    try {
      const response = await this.client['/v1/api/auth/test-token'].post();

      const validatedResponse = schemas.UserResponse.parse(response);
      return {
        data: validatedResponse,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
