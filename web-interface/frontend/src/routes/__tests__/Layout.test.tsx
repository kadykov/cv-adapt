import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../Layout';

// Mock the auth hooks
vi.mock('../../features/auth/hooks', () => ({
  useAuthState: vi.fn(),
  useLogoutMutation: vi.fn(),
}));

import { useAuthState, useLogoutMutation } from '../../features/auth/hooks';

const mockUseAuthState = useAuthState as jest.Mock;
const mockUseLogoutMutation = useLogoutMutation as jest.Mock;

function renderLayout(isAuthenticated: boolean = false) {
  mockUseAuthState.mockReturnValue({
    isAuthenticated,
    isLoading: false,
  });

  mockUseLogoutMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });

  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    mockUseAuthState.mockClear();
    mockUseLogoutMutation.mockClear();
  });

  it('shows login button when not authenticated', () => {
    renderLayout(false);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
  });

  it('shows loading state when checking authentication', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows navigation options when authenticated', () => {
    renderLayout(true);
    expect(screen.getByText(/jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
  });

  it('shows the main content area', () => {
    renderLayout();
    // The main content area should have a container class
    expect(screen.getByRole('main')).toHaveClass('container');
  });

  it('shows the brand name that links to home', () => {
    renderLayout();
    const brandLink = screen.getByText(/cv adapt/i);
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('shows loading state during logout', () => {
    mockUseAuthState.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    mockUseLogoutMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
