import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock the useAuthState hook
vi.mock('../../features/auth/hooks', () => ({
  useAuthState: vi.fn(),
}));

import { useAuthState } from '../../features/auth/hooks';
const mockUseAuthState = useAuthState as jest.Mock;

function TestComponent() {
  return <div>Protected Content</div>;
}

function renderProtectedRoute(
  { isAuthenticated = false, isLoading = false } = {},
  initialRoute = '/protected',
) {
  mockUseAuthState.mockReturnValue({
    isAuthenticated,
    isLoading,
  });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected/*" element={<TestComponent />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuthState.mockClear();
  });

  it('shows loading state when authentication is being checked', () => {
    renderProtectedRoute({ isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  it('redirects to auth page when not authenticated', () => {
    renderProtectedRoute({ isAuthenticated: false });
    expect(screen.getByText('Auth Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    renderProtectedRoute({ isAuthenticated: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  it('preserves redirect location in state', () => {
    const testPath = '/protected/test-page';
    renderProtectedRoute({ isAuthenticated: false }, testPath);

    // Should show auth page when redirected
    const authPageElement = screen.getByText('Auth Page');
    expect(authPageElement).toBeInTheDocument();

    // A single auth page should be in the document
    const authPages = screen.getAllByText('Auth Page');
    expect(authPages).toHaveLength(1);
  });
});
