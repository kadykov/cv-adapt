import axios from 'axios';
import type { AxiosResponse } from 'axios';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export const axiosInstance = axios.create({
  baseURL: '/v1/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler to convert axios errors to our ApiError format
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if (error.response) {
      const data = error.response.data as { message?: string } | undefined;
      throw new ApiError(
        data?.message || 'An unknown error occurred',
        error.response.status,
      );
    }
    throw error;
  },
);

// Type-safe request methods
export const client = {
  get: <T>(path: string) =>
    axiosInstance.get<T>(path).then((response) => response.data),
  post: <T>(path: string, data: unknown) =>
    axiosInstance.post<T>(path, data).then((response) => response.data),
  put: <T>(path: string, data: unknown) =>
    axiosInstance.put<T>(path, data).then((response) => response.data),
  delete: <T>(path: string) =>
    axiosInstance.delete<T>(path).then((response) => response.data),
};
