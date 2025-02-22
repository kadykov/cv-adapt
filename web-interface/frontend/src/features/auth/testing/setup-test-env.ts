import { vi } from 'vitest';
import { mockAuthResponse } from '../../../test/utils/auth-test-utils';

// Create mock functions
export const mockValidateToken = vi.fn().mockResolvedValue(mockAuthResponse);
export const mockLogin = vi.fn().mockResolvedValue(mockAuthResponse);
export const mockLogout = vi.fn().mockResolvedValue(undefined);

// Configure mock module
vi.mock('../services/auth-mutations', () => ({
  authMutations: {
    validateToken: mockValidateToken,
    login: mockLogin,
    logout: mockLogout,
  },
}));
