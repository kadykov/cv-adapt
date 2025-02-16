import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createTestHelpers } from './setup';
import { AuthContext, type AuthContextType } from '@/features/auth/context/AuthContext';
import type { AuthResponse } from '@/types/api';

// Custom render options interface
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  route?: string;
  authenticated?: boolean;
  authContext?: Partial<AuthContextType>;
}

// Create mock auth response
const createMockAuthResponse = (): AuthResponse => ({
  access_token: 'test_token',
  refresh_token: 'test_refresh_token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
});

// Default wrapper with providers
const AllProviders = ({
  children,
  route = '/',
  authenticated = false,
  authContext = {},
}: {
  children: React.ReactNode;
  route?: string;
  authenticated?: boolean;
  authContext?: Partial<AuthContextType>;
}) => {
  // Set initial URL if provided
  window.history.pushState({}, 'Test page', route);

  // Set up auth token if authenticated
  if (authenticated) {
    localStorage.setItem('access_token', 'test_token');
  }

  // Set up test helpers
  const { simulateSuccess } = createTestHelpers();

  // Set up mock auth response if authenticated
  const mockAuthResponse = createMockAuthResponse();
  if (authenticated) {
    simulateSuccess('/api/v1/auth/refresh', 'post', mockAuthResponse);
  }

  const defaultAuthContext: AuthContextType = {
    isAuthenticated: authenticated,
    user: authenticated ? mockAuthResponse.user : null,
    token: authenticated ? 'test_token' : null,
    isLoading: false,
    login: async () => mockAuthResponse,
    register: async () => mockAuthResponse,
    logout: async () => {},
    refreshToken: async () => {},
    ...authContext
  };

  return (
    <BrowserRouter>
      <AuthContext.Provider value={defaultAuthContext}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

// Custom render function
const render = (
  ui: React.ReactElement,
  {
    route,
    authenticated = false,
    authContext = {},
    ...options
  }: CustomRenderOptions = {}
) => {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllProviders
        route={route}
        authenticated={authenticated}
        authContext={authContext}
      >
        {children}
      </AllProviders>
    ),
    ...options,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { render };
