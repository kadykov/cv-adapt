import type { LoginCredentials, RegistrationData } from "../types";
import { authResponseSchema, type AuthResponse } from "../../../validation/openapi";
import config from "../../../config/env";

const API_BASE_URL = `${config.apiBaseUrl}/${config.apiVersion}`;
console.log('API Base URL:', API_BASE_URL);

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

async function handleAuthResponse(response: Response): Promise<AuthResponse> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.log('Error response body:', errorData);

      let errorDetails;
      if (errorData.detail && typeof errorData.detail === 'object') {
        errorDetails = errorData.detail;
      } else if (typeof errorData.detail === 'string') {
        errorDetails = { message: errorData.detail };
      } else if (response.status === 401) {
        errorDetails = { message: "Invalid email or password" };
      } else {
        errorDetails = { message: "Authentication failed" };
      }

      throw new AuthenticationError(errorDetails.message, response.status, errorDetails);
    } catch (e) {
      if (e instanceof AuthenticationError) {
        throw e;
      }
      // If we can't parse the error response, throw a generic error
      throw new AuthenticationError(
        response.statusText || "An unexpected error occurred",
        response.status
      );
    }
  }

  const data = await response.json();
  return authResponseSchema.parse(data);
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Map email to username as required by OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // Backend's OAuth2 form expects 'username' field
  formData.append('password', credentials.password);
  formData.append('grant_type', 'password');  // Required by backend OAuth flow

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    credentials: "include",
    body: formData,
  });

  return handleAuthResponse(response);
}

export async function register(data: RegistrationData): Promise<AuthResponse> {
  console.log('Registration data:', data);

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Accept": "application/json"
    }),
    credentials: "include",
    body: JSON.stringify(data),
  });

  console.log('Registration response status:', response.status);
  console.log('Registration response headers:', Object.fromEntries(response.headers.entries()));

  return handleAuthResponse(response);
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    throw new AuthenticationError("Logout failed");
  }
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    credentials: "include"
  });

  return handleAuthResponse(response);
}
