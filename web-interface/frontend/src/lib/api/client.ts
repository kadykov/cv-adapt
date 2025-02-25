import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { tokenService } from '../../features/auth/services/token-service';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export const axiosInstance = axios.create({
  // baseURL configured through environment
  baseURL:
    process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '/v1/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handler to convert axios errors to our ApiError format
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if (error.response) {
      const data = error.response.data as
        | { message?: string; detail?: { message?: string } }
        | undefined;

      // Extract message from various possible locations in response
      const message =
        data?.message ||
        data?.detail?.message ||
        error.response.statusText ||
        'An unknown error occurred';

      throw new ApiError(message, error.response.status);
    }
    throw error;
  },
);

// Type-safe request methods
export const client = {
  get: <T>(path: string) =>
    axiosInstance.get<T>(path).then((response) => response.data),
  post: <T>(path: string, data: unknown, config = {}) =>
    axiosInstance.post<T>(path, data, config).then((response) => response.data),
  postForm: <T>(path: string, data: Record<string, string>) => {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return axiosInstance
      .post<T>(path, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((response) => response.data);
  },
  put: <T>(path: string, data: unknown) =>
    axiosInstance.put<T>(path, data).then((response) => response.data),
  delete: <T>(path: string) =>
    axiosInstance.delete<T>(path).then((response) => response.data),
};
