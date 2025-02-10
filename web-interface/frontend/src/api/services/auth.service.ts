import { apiClient } from "../core/api-client";
import type { AuthResponse, LoginCredentials, RegistrationData } from "../../features/auth/types";
import { ApiError } from "../core/api-error";
import { authResponseSchema } from "../../validation/openapi";

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Map email to username as required by OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);
    formData.append("grant_type", "password");

    try {
      const response = await apiClient.post<AuthResponse>("auth/login", formData, {
        requiresAuth: false,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return authResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to authenticate", undefined);
    }
  }

  async register(data: RegistrationData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("auth/register", data, {
        requiresAuth: false,
      });

      return authResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Registration failed", undefined);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("auth/logout", undefined, {
        credentials: "include",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Logout failed", undefined);
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "auth/refresh",
        undefined,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return authResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError("Invalid token", 401);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Token refresh failed", undefined);
    }
  }
}

export const authService = new AuthService();
