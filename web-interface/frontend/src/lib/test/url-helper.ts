const TEST_API_BASE = 'http://localhost:3000';

/**
 * Helper function to generate test API URLs consistently
 */
export function getTestApiUrl(path: string): string {
  // Remove any leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove /v1/api prefix if present
  const finalPath = cleanPath.startsWith('v1/api/')
    ? cleanPath.slice(7)
    : cleanPath;
  return `${TEST_API_BASE}/${finalPath}`;
}

// Export base URL for direct use
export const TEST_BASE_URL = TEST_API_BASE;
