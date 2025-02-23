import { describe, test, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { RenderOptions } from '@testing-library/react';
import {
  render,
  screen,
  waitFor,
  createGetHandler,
  addIntegrationHandlers,
} from '../../../../lib/test/integration';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockUser } from '../../testing/fixtures';
import { ProtectedRoute } from '../../../../lib/auth/ProtectedRoute';
import { AuthProvider } from '../../components/AuthProvider';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import React from 'react';

// Create RenderOptions type that includes wrapper
interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType;
}

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Protected Route Integration', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  test('should redirect to login when not authenticated', async () => {
    // Set up handlers for unauthenticated state
    addIntegrationHandlers([
      createGetHandler('/v1/api/users/me', 'UserResponse', null, {
        status: 401,
      }),
    ]);

    const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/protected']}>
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    render(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { wrapper: RouterWrapper } as TestRenderOptions,
    );

    // Should redirect to login
    const loginPage = await screen.findByText('Login Page');
    expect(loginPage).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('should preserve original route after authentication', async () => {
    // Set up handlers for unauthenticated state
    addIntegrationHandlers([
      createGetHandler('/v1/api/users/me', 'UserResponse', null, {
        status: 401,
      }),
    ]);

    const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/protected']}>
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    render(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { wrapper: RouterWrapper } as TestRenderOptions,
    );

    const loginPage = await screen.findByText('Login Page');
    expect(loginPage).toBeInTheDocument();
  });

  test('should render protected content when authenticated with valid tokens', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    // Set up handlers for authenticated state
    addIntegrationHandlers([
      // Mock successful auth check
      http.get('/v1/api/users/me', ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.includes('valid-access-token')) {
          return HttpResponse.json(mockUser);
        }
        return new HttpResponse(null, { status: 401 });
      }),
    ]);

    // Mock authenticated state with tokens
    localStorage.setItem('access_token', 'valid-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('expires_at', (Date.now() + 3600000).toString());

    const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/protected']}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    render(
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { wrapper: RouterWrapper } as TestRenderOptions,
    );

    // Wait for initial query to complete
    await queryClient.resetQueries();

    // Wait for auth check to complete and content to render
    await waitFor(
      () => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify that login page is not shown and no redirection happened
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
