import type { LoginCredentials, RegistrationData } from "../types";
import { authResponseSchema, type AuthResponse } from "../../../validation/openapi";
import config from "../../../config/env";

const API_BASE_URL = `${config.apiBaseUrl}/${config.apiVersion}`;
console.log('[Auth API] Base URL:', API_BASE_URL);

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
  console.log('[Auth API] Handling response:', {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.log('[Auth API] Error response body:', errorData);

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
      console.log('[Auth API] Error parsing error response:', e);
      throw new AuthenticationError(
        response.statusText || "An unexpected error occurred",
        response.status
      );
    }
  }

  try {
    const data = await response.json();
    console.log('[Auth API] Success response data:', data);

    try {
      const validatedData = authResponseSchema.parse(data);
      console.log('[Auth API] Validation successful:', validatedData);
      return validatedData;
    } catch (e) {
      console.error('[Auth API] Schema validation error:', e);
      throw new AuthenticationError("Invalid response format", response.status);
    }
  } catch (e) {
    console.error('[Auth API] Error parsing response JSON:', e);
    throw new AuthenticationError("Invalid response format", response.status);
  }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  console.log('[Auth API] Starting login request');

  // Map email to username as required by OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // Backend's OAuth2 form expects 'username' field
  formData.append('password', credentials.password);
  formData.append('grant_type', 'password');  // Required by backend OAuth flow

  const url = `${API_BASE_URL}/auth/login`;
  console.log('[Auth API] Making request to:', url);
  console.log('[Auth API] Request body:', formData.toString());

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      credentials: "include",
      body: formData,
    });

    console.log('[Auth API] Received response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    return handleAuthResponse(response);
  } catch (e) {
    console.error('[Auth API] Network or fetch error:', e);
    throw new AuthenticationError("Network error occurred", undefined);
  }
}

export async function register(data: RegistrationData): Promise<AuthResponse> {
  console.log('[Auth API] Starting registration', data);

  const url = `${API_BASE_URL}/auth/register`;
  console.log('[Auth API] Making request to:', url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json"
      }),
      credentials: "include",
      body: JSON.stringify(data),
    });

    console.log('[Auth API] Registration response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

    return handleAuthResponse(response);
  } catch (e) {
    console.error('[Auth API] Registration error:', e);
    throw new AuthenticationError("Registration failed", undefined);
  }
}

export async function logout(): Promise<void> {
  console.log('[Auth API] Starting logout');

  const url = `${API_BASE_URL}/auth/logout`;
  console.log('[Auth API] Making request to:', url);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    console.error('[Auth API] Logout failed:', response);
    throw new AuthenticationError("Logout failed");
  }

  console.log('[Auth API] Logout successful');
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  console.log('[Auth API] Starting token refresh');

  const url = `${API_BASE_URL}/auth/refresh`;
  console.log('[Auth API] Making request to:', url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      credentials: "include"
    });

    return handleAuthResponse(response);
  } catch (e) {
    console.error('[Auth API] Token refresh error:', e);
    throw new AuthenticationError("Token refresh failed", undefined);
  }
}
