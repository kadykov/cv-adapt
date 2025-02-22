import { vi } from 'vitest';
import { mockAuthResponse } from '../../../test/utils/auth-test-utils';

const validateTokenMock = vi.fn().mockResolvedValue(mockAuthResponse);
const loginMock = vi.fn().mockResolvedValue(mockAuthResponse);
const logoutMock = vi.fn().mockResolvedValue(undefined);

// Export individual mocks for test usage
export const authMutationsMocks = {
  validateToken: validateTokenMock,
  login: loginMock,
  logout: logoutMock,
};

// Export mock setup function
export const setupAuthMutationsMocks = () => {
  vi.mock('../services/auth-mutations', () => ({
    authMutations: {
      validateToken: validateTokenMock,
      login: loginMock,
      logout: logoutMock,
    },
  }));
};
