import { type RenderResult, render } from '@testing-library/react';
import { type Mock, vi } from 'vitest';
import { ProvidersWrapper } from '../setup/providers';
import { authMutations } from '../../features/auth/services/auth-mutations';
import type { AuthResponse, User } from '../../lib/api/generated-types';

// Mock auth mutations
vi.mock('../../features/auth/services/auth-mutations');

export const mockAuthMutations = authMutations as {
  login: Mock;
  register: Mock;
  refresh: Mock;
  logout: Mock;
  validateToken: Mock;
};

export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-21T12:00:00Z',
};

export const mockAuthResponse: AuthResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser,
};

export const renderWithProviders = (ui: React.ReactElement): RenderResult => {
  return render(ui, { wrapper: ProvidersWrapper });
};

// Reset all mocks between tests
export const resetAuthMocks = () => {
  mockAuthMutations.login.mockReset();
  mockAuthMutations.register.mockReset();
  mockAuthMutations.refresh.mockReset();
  mockAuthMutations.logout.mockReset();
  mockAuthMutations.validateToken.mockReset();
};

// Setup successful auth state
export const setupAuthenticatedState = () => {
  mockAuthMutations.validateToken.mockResolvedValue(mockAuthResponse);
};

// Setup failed auth state
export const setupUnauthenticatedState = () => {
  mockAuthMutations.validateToken.mockResolvedValue(null);
};
