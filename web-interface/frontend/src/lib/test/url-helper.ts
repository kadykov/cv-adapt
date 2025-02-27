const TEST_API_BASE = '/v1/api';

/**
 * Helper function to generate test API URLs consistently
 */
export function getTestApiUrl(path: string): string {
  // Remove any leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Always return path with /v1/api prefix
  return `${TEST_API_BASE}/${cleanPath}`;
}

// Export base URL for direct use
export const TEST_BASE_URL = TEST_API_BASE;
