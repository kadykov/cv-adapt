import { apiClient } from "../core/api-client";
import type { AuthResponse, LoginCredentials, RegistrationData } from "../../features/auth/types";
import { ApiError } from "../core/api-error";

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);
    formData.append("grant_type", "password");

    try {
      const response = await apiClient.post<AuthResponse>("v1/auth/login", formData, {
        requiresAuth: false,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to authenticate", undefined);
    }
  }

  async register(data: RegistrationData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("v1/auth/register", data, {
        requiresAuth: false,
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Registration failed", undefined);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("v1/auth/logout", undefined, {
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
        "v1/auth/refresh",
        { token },
        {
          requiresAuth: false
        }
      );

      return response;
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
