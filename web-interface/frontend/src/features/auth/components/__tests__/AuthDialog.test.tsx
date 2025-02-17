import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthDialog } from '../AuthDialog';
import { AuthProvider } from '../../context';
import { createTestQueryClient } from '../../testing';
import '@testing-library/jest-dom';

// Mock child components to simplify tests
vi.mock('../LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock('../RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form">Register Form</div>,
}));

describe('AuthDialog', () => {
  const renderDialog = (props = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthDialog isOpen={true} onClose={() => {}} {...props} />
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it('renders login form by default', () => {
    renderDialog();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('shows correct heading in DialogTitle', () => {
    renderDialog();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sign In');
  });

  it('updates DialogTitle when switching views', async () => {
    renderDialog();
    const user = userEvent.setup();

    await user.click(screen.getByText(/sign up/i));
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Account');

    await user.click(screen.getByText(/sign in/i));
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sign In');
  });

  it('switches to register form when clicking sign up', async () => {
    renderDialog();
    const user = userEvent.setup();

    const signUpButton = screen.getByRole('button', { name: /sign up/i });
    await user.hover(signUpButton);
    expect(signUpButton).toHaveAttribute('data-hover');

    await user.click(signUpButton);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('switches back to login form when clicking sign in', async () => {
    renderDialog({ initialView: 'register' });
    const user = userEvent.setup();

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.hover(signInButton);
    expect(signInButton).toHaveAttribute('data-hover');

    await user.click(signInButton);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside dialog', async () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    const backdrop = screen.getByRole('dialog').parentElement?.querySelector('.fixed.bg-black\\/30');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('starts with register view when initialView is register', () => {
    renderDialog({ initialView: 'register' });

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Create Account');
  });

  it('renders dialog with correct structure and styling', () => {
    renderDialog();

    // Check backdrop
    const backdrop = screen.getByRole('dialog').parentElement?.querySelector('.fixed.bg-black\\/30');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');

    // Check dialog root and panel
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('relative', 'z-50');
    expect(dialog.querySelector('.modal-box')).toHaveClass('modal-box', 'bg-base-100');

    // Check dialog header
    expect(screen.getByRole('heading', { level: 3 }))
      .toHaveClass('text-2xl', 'font-bold', 'text-primary');

    // Check buttons styling
    const button = screen.getByRole('button', { name: /sign up/i });
    expect(button).toHaveClass('btn', 'btn-link', 'btn-sm');
  });
});
