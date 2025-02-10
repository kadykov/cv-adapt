import { apiConfig, type RequestOptions } from "../config/api-config";
import { ApiError } from "./api-error";

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(apiConfig.authTokenKey);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Only try to process headers for real Response objects (not mocks in tests)
    try {
      if (response.headers && typeof response.headers.entries === 'function') {
        // Headers available but not needed for now
        Object.fromEntries(response.headers.entries());
      }
    } catch (e) {
      // Ignore header processing errors
    }

    if (!response.ok) {
      try {
        const data = await response.json();
        throw ApiError.fromResponse(response, data);
      } catch (e) {
        if (e instanceof ApiError) {
          throw e;
        }
        throw ApiError.fromResponse(response);
      }
    }

    // For DELETE operations or no-content responses
    if (response.status === 204) {
      return null as T;
    }

    try {
      const data = await response.json();
      return data as T;
    } catch (e) {
      throw new ApiError("Invalid response format", response.status);
    }
  }

  private getHeaders(options: RequestOptions = {}): HeadersInit {
    const { requiresAuth = true } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getFullUrl(path: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // For auth endpoints, use v1/auth/* path
    if (cleanPath.startsWith("auth/")) {
      return `${apiConfig.baseUrl}/v1/${cleanPath}`;
    }

    // For other API endpoints, use configured URL (which includes version)
    return `${apiConfig.getFullUrl()}/${cleanPath}`;
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      const { requiresAuth, headers, ...init } = options;
      const response = await fetch(this.getFullUrl(path), {
        ...init,
        headers: this.getHeaders({ requiresAuth, headers }),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      throw ApiError.fromError(error);
    }
  }

  async post<T>(
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      const { requiresAuth, headers, ...init } = options;
      const response = await fetch(this.getFullUrl(path), {
        method: "POST",
        body: data instanceof URLSearchParams ? data : JSON.stringify(data),
        ...init,
        headers: this.getHeaders({ requiresAuth, headers }),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      throw ApiError.fromError(error);
    }
  }

  async put<T>(
    path: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      const { requiresAuth, headers, ...init } = options;
      const response = await fetch(this.getFullUrl(path), {
        method: "PUT",
        body: JSON.stringify(data),
        ...init,
        headers: this.getHeaders({ requiresAuth, headers }),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      throw ApiError.fromError(error);
    }
  }

  async delete(path: string, options: RequestOptions = {}): Promise<void> {
    try {
      const { requiresAuth, headers, ...init } = options;
      const response = await fetch(this.getFullUrl(path), {
        method: "DELETE",
        ...init,
        headers: this.getHeaders({ requiresAuth, headers }),
      });
      await this.handleResponse<void>(response);
    } catch (error) {
      throw ApiError.fromError(error);
    }
  }
}

export const apiClient = ApiClient.getInstance();
