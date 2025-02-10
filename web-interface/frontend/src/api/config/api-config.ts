import config from "../../config/env";

export interface ApiConfig {
  baseUrl: string;
  version: string;
  authTokenKey: string;
  getFullUrl: () => string;
}

export const apiConfig: ApiConfig = {
  baseUrl: config.apiBaseUrl,
  version: config.apiVersion,
  authTokenKey: config.authTokenKey,
  getFullUrl: () => `${config.apiBaseUrl}/${config.apiVersion}`,
};

export type RequestOptions = {
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
} & Omit<RequestInit, "headers">;
