import { paths } from '../types/api-schema';

/**
 * API paths constants with type safety from OpenAPI schema
 * These paths are used across the application to ensure consistency
 * with the API contract defined in the OpenAPI schema.
 */
export const API_PATHS = {
  auth: {
    login: '/v1/api/auth/login' as const,
    logout: '/v1/api/auth/logout' as const,
    refresh: '/v1/api/auth/refresh' as const
  },
  // Add other API sections as we discover them
} as const;

/**
 * Type to ensure API_PATHS values match OpenAPI schema
 */
type ValidateApiPaths<T> = {
  [K in keyof T]: T[K] extends { [key: string]: string }
    ? { [P in keyof T[K]]: T[K][P] extends keyof paths ? T[K][P] : never }
    : T[K] extends keyof paths
    ? T[K]
    : never;
};

/**
 * Type assertion to ensure all paths exist in OpenAPI schema
 */
export const validatedPaths: ValidateApiPaths<typeof API_PATHS> = API_PATHS;

/**
 * Get a path value with type checking
 */
export function getApiPath<
  Section extends keyof typeof API_PATHS,
  Path extends keyof typeof API_PATHS[Section]
>(section: Section, path: Path): typeof API_PATHS[Section][Path] {
  return API_PATHS[section][path];
}
