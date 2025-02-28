import { BASE_PATH } from '../api/config';

/**
 * Sanitizes a path by removing leading and trailing slashes
 * @param path - The path to sanitize
 */
function sanitizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '');
}

/**
 * Helper function to generate test API URLs consistently
 * @param path - The API endpoint path
 * @throws {Error} If path is empty or consists only of slashes
 */
export function getTestApiUrl(path: string): string {
  if (!path || path.trim().length === 0) {
    throw new Error('Path cannot be empty');
  }

  const cleanPath = sanitizePath(path);
  if (!cleanPath) {
    throw new Error('Path cannot consist only of slashes');
  }

  return `${BASE_PATH}/${cleanPath}`;
}

// Export base URL for direct use in test configurations
export const TEST_BASE_URL = BASE_PATH;
