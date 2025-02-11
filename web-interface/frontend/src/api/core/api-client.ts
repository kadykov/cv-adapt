import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';

interface RequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
  credentials?: RequestCredentials;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (axios.isAxiosError(error)) {
          throw new ApiError(
            error.response?.data?.message || error.message,
            error.response?.status
          );
        }
        throw error;
      }
    );
  }

  public async get<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.client.get<T, T>(path, config);
    return response;
  }

  public async post<T>(path: string, data?: unknown, config: RequestConfig = {}): Promise<T> {
    const response = await this.client.post<T, T>(path, data, config);
    return response;
  }

  public async put<T>(path: string, data: unknown, config: RequestConfig = {}): Promise<T> {
    const response = await this.client.put<T, T>(path, data, config);
    return response;
  }

  public async delete<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.client.delete<T, T>(path, config);
    return response;
  }
}

export const apiClient = new ApiClient();
