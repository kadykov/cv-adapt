import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../Layout';

// Mock the useAuth hook
vi.mock('../../features/auth/hooks', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../features/auth/hooks';

const mockUseAuth = useAuth as jest.Mock;

function renderLayout(isAuthenticated: boolean = false) {
  mockUseAuth.mockReturnValue({
    isAuthenticated,
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <Layout />
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('shows login button when not authenticated', () => {
    renderLayout(false);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/jobs/i)).not.toBeInTheDocument();
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
});
