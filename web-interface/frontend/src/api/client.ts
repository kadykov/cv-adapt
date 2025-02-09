interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api';
  }

  static getInstance(): ApiClient {
    if (!this.instance) {
      this.instance = new ApiClient();
    }
    return this.instance;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
        throw new ApiError(errorMessage, response.status, errorData);
      } catch (e) {
        throw new ApiError(errorMessage, response.status);
      }
    }

    // For DELETE operations or no-content responses
    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch (e) {
      // If there's no content or it's not JSON, return null
      return null;
    }
  }

  private getHeaders(requiresAuth: boolean = true): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { requiresAuth = true, ...init } = config;
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...init.headers,
      },
    });
    return this.handleResponse(response);
  }

  async post<T>(path: string, data?: Record<string, unknown>, config: RequestConfig = {}): Promise<T> {
    const { requiresAuth = true, ...init } = config;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...init,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...init.headers,
      },
    });
    return this.handleResponse(response);
  }

  async put<T>(path: string, data?: Record<string, unknown>, config: RequestConfig = {}): Promise<T> {
    const { requiresAuth = true, ...init } = config;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...init,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...init.headers,
      },
    });
    return this.handleResponse(response);
  }

  async delete(path: string, config: RequestConfig = {}): Promise<void> {
    const { requiresAuth = true, ...init } = config;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      ...init,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...init.headers,
      },
    });
    return this.handleResponse(response);
  }
}

export const apiClient = ApiClient.getInstance();
