import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthDialog } from '../AuthDialog';
import { AuthProvider } from '../../context';
import { createTestQueryClient } from '../../testing';

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

  it('switches to register form when clicking sign up', async () => {
    renderDialog();
    const user = userEvent.setup();

    await user.click(screen.getByText(/sign up/i));

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('switches back to login form when clicking sign in', async () => {
    renderDialog({ initialView: 'register' });
    const user = userEvent.setup();

    await user.click(screen.getByText(/sign in/i));

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside dialog', async () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    // Click backdrop div that has fixed and bg-black/30 classes
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
  });
});
