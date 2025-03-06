import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../../features/auth/services/token-service';
import { authApi } from './auth';
import { axiosInstance } from './client';

interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(request.config);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = () => {
  // Request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // Response interceptor to handle token refresh
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Check if it's a retry
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // Check if the error is due to an expired token
      if (error.response?.status === 401) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest });
          });
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const refreshToken = tokenService.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refresh({ token: refreshToken });
          tokenService.storeTokens(response);

          // Update the failed requests with new token
          const token = response.access_token;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null);

          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error);
          tokenService.clearTokens(); // Clear tokens on refresh failure
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
};

// Add a development mode request logger
if (import.meta.env.DEV) {
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config;
    },
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        console.error(
          `[API Error] ${error.response?.status} ${error.config?.url}`,
          error.response?.data,
        );
      } else {
        console.error('[API Error] Unknown error', error);
      }
      return Promise.reject(error);
    },
  );
}
