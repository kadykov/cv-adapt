import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock the useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

// Import useAuth after mocking
import { useAuth } from '../useAuth';

// Helper component to test navigation state
const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location-display">{JSON.stringify(location.state)}</div>
  );
};

describe('ProtectedRoute', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  interface MockAuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    clearAuth: () => void;
  }

  const defaultMockAuth: MockAuthState = {
    isAuthenticated: false,
    isLoading: false,
    token: null,
    clearAuth: () => {},
  };

  const renderWithProviders = (
    initialPath = '/',
    redirectTo = '/login',
    mockAuthOverrides: Partial<MockAuthState> = {},
  ) => {
    const mockAuth = { ...defaultMockAuth, ...mockAuthOverrides };
    (useAuth as Mock).mockReturnValue(mockAuth);

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path="/protected-path"
              element={
                <ProtectedRoute redirectTo={redirectTo}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <>
                  <div>Login Page</div>
                  <LocationDisplay />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('should render children when authenticated', () => {
    renderWithProviders('/protected-path', '/login', {
      isAuthenticated: true,
      isLoading: false,
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderWithProviders('/protected-path', '/login', {
      isAuthenticated: false,
      isLoading: false,
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders('/protected-path', '/login', {
      isAuthenticated: false,
      isLoading: true,
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should use default redirect path when none provided', () => {
    renderWithProviders('/protected-path', undefined, {
      isAuthenticated: false,
      isLoading: false,
    });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should preserve current location in state when redirecting', () => {
    renderWithProviders('/protected-path', '/login', {
      isAuthenticated: false,
      isLoading: false,
    });

    const locationState = screen.getByTestId('location-display');
    expect(locationState.textContent).toBe(
      JSON.stringify({ from: '/protected-path' }),
    );
  });
});
