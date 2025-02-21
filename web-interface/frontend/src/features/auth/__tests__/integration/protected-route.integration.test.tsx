// This needs to be at the very top
vi.mock('react-router-dom', async () => {
  const actual = await import('../mocks/react-router-dom');
  return actual;
});

import { describe, test, expect, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  createGetHandler,
  addIntegrationHandlers,
  type TestOptions,
} from '../../../../lib/test/integration';
import { mockUser } from '../../testing/fixtures';
import { ProtectedRoute } from '../../../../lib/auth/ProtectedRoute';
import {
  Routes,
  Route,
  MemoryRouter,
  Navigate,
} from '../mocks/react-router-dom';
import { mockNavigate } from '../mocks/mock-router-state';

describe('Protected Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const TestComponent = () => <div>Protected Content</div>;

  // Add handlers for protected route testing
  addIntegrationHandlers([
    createGetHandler('/v1/api/users/me', 'UserResponse', mockUser),
  ]);

  test('should redirect to login when not authenticated', async () => {
    render(
      <Routes>
        <Route path="/" element={<Navigate to="/protected" replace />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/*" element={<div>Login Page</div>} />
      </Routes>,
      {
        routerComponent: MemoryRouter,
        initialEntries: ['/protected'],
      } as TestOptions,
    );

    // Should be redirected to login
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  test('should preserve original route after authentication', async () => {
    render(
      <Routes>
        <Route path="/" element={<Navigate to="/protected" replace />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/*" element={<div>Login Page</div>} />
      </Routes>,
      {
        routerComponent: MemoryRouter,
        initialEntries: ['/protected'],
      } as TestOptions,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth?returnTo=/protected');
    });
  });
});
