/**
 * API configuration constants and types
 */

export const API_VERSION = 'v1';
export const API_PREFIX = 'api';

export const BASE_PATH = `/${API_VERSION}/${API_PREFIX}`;

// Environment-specific configurations
export const API_CONFIG = {
  development: {
    baseUrl: BASE_PATH,
  },
  test: {
    baseUrl: BASE_PATH,
  },
  production: {
    baseUrl: BASE_PATH,
  },
} as const;

// Type for the environment
export type ApiEnvironment = keyof typeof API_CONFIG;

/**
 * Helper to get the base URL for the current environment
 */
export function getBaseUrl(
  environment: ApiEnvironment = 'development',
): string {
  return API_CONFIG[environment].baseUrl;
}
