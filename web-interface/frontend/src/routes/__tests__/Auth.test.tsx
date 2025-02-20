import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Auth } from '../Auth';

// Mock the login/register forms
vi.mock('../../features/auth/components/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div>
      Login Form
      <button onClick={onSuccess}>Submit Login</button>
    </div>
  ),
}));

vi.mock('../../features/auth/components/RegisterForm', () => ({
  RegisterForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div>
      Register Form
      <button onClick={onSuccess}>Submit Register</button>
    </div>
  ),
}));

// Mock component to capture current location for testing navigation
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe('Auth', () => {
  it('shows login form by default', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Form')).toBeInTheDocument();
    expect(screen.queryByText('Register Form')).not.toBeInTheDocument();
  });

  it('switches between login and register forms', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    // Initial state - login form
    expect(screen.getByText('Login Form')).toBeInTheDocument();

    // Switch to register
    fireEvent.click(screen.getByText(/need an account/i));
    expect(screen.getByText('Register Form')).toBeInTheDocument();
    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();

    // Switch back to login
    fireEvent.click(screen.getByText(/already have an account/i));
    expect(screen.getByText('Login Form')).toBeInTheDocument();
    expect(screen.queryByText('Register Form')).not.toBeInTheDocument();
  });

  it('navigates to home after successful login', () => {
    render(
      <MemoryRouter>
        <Auth />
        <LocationDisplay />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Submit Login'));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('navigates to home after successful registration', () => {
    render(
      <MemoryRouter>
        <Auth />
        <LocationDisplay />
      </MemoryRouter>,
    );

    // Switch to register form
    fireEvent.click(screen.getByText(/need an account/i));
    fireEvent.click(screen.getByText('Submit Register'));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('preserves redirect location from state', () => {
    const from = '/jobs';
    render(
      <MemoryRouter initialEntries={[{ pathname: '/auth', state: { from } }]}>
        <Auth />
        <LocationDisplay />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Submit Login'));
    expect(screen.getByTestId('location')).toHaveTextContent(from);
  });
});
