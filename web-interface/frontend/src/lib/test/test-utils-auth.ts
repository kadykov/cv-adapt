import { tokenService } from '../../features/auth/services/token-service';
import type { AuthResponse } from '../api/generated-types';

/**
 * Helper to setup auth token for tests
 */
export function setTestAuthToken() {
  const mockAuthResponse: AuthResponse = {
    access_token: 'test-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    user: {
      id: 1,
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      personal_info: null,
    },
  };

  localStorage.setItem('access_token', mockAuthResponse.access_token);
  tokenService.storeTokens(mockAuthResponse);
}

/**
 * Helper to clear auth token for tests
 */
export function clearTestAuthToken() {
  localStorage.clear();
  tokenService.clearTokens();
}
