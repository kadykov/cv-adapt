import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { server } from '@/test/server';
import { HttpResponse } from 'msw';

// Component
import { LoginForm } from '../../LoginForm';

// Test utilities
import {
  render,
  createTestHelpers,
  createTestEnvironment,
  expectLoadingState,
  expectErrorState,
  expectSuccessState
} from '@/test';

// Generated types and builders
import { getApiPath } from '@/api/api-paths';
import { builders } from '@/types/test-data';

// Navigation mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  mockNavigate.mockReset();
});
afterAll(() => server.close());

describe('LoginForm', () => {
  const loginPath = getApiPath('auth', 'login');
  const { simulateSuccess, simulateError, simulateLoading } = createTestHelpers();
  const user = userEvent.setup();

  // Test data
  const validData = {
    email: 'test@example.com',
    password: 'password123'
  };
  const invalidEmail = 'notanemail';

  // Helper functions
  const fillForm = async (email: string, password: string) => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.clear(emailInput);
    await user.type(emailInput, email);

    await user.clear(passwordInput);
    await user.type(passwordInput, password);
  };

  const submitForm = async () => {
    const form = screen.getByRole('form');
    await user.click(form.querySelector('button[type="submit"]')!);
  };

  describe('Form Validation', () => {
    it('validates empty form submission', async () => {
      render(<LoginForm />);
      await submitForm();

      await expectErrorState('Constraints not satisfied');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      render(<LoginForm />);
      await fillForm(invalidEmail, validData.password);
      await submitForm();

      await expectErrorState('Invalid email address');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Login Process', () => {
    it('handles successful login', async () => {
      const mockData = builders.auth.loginResponse();

      simulateLoading(loginPath, 'post');
      render(<LoginForm />);
      await fillForm(validData.email, validData.password);
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Verify loading state
      await expectLoadingState();

      // Simulate success
      simulateSuccess(loginPath, 'post', mockData);

      // Verify success state
      await expectSuccessState();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(localStorage.getItem('token')).toBe(mockData.access_token);
    });

    it('shows loading state', async () => {
      simulateLoading(loginPath, 'post', 500);

      render(<LoginForm />);
      await fillForm(validData.email, validData.password);
      await user.click(screen.getByRole('button', { name: /login/i }));

      await expectLoadingState();
    });

    it('handles error states', async () => {
      simulateError(loginPath, 'post', {
        status: 401,
        message: 'Invalid credentials'
      });

      render(<LoginForm />);
      await fillForm(validData.email, 'wrongpass');
      await submitForm();

      await expectErrorState('Invalid credentials');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    const env = createTestEnvironment();

    it('meets accessibility requirements', async () => {
      await env.verifyAccessibility(<LoginForm />);
    });

    it('announces form state changes', async () => {
      render(<LoginForm />);
      await env.verifyAnnouncements([
        'Form loaded',
        async () => {
          await submitForm();
          return 'Constraints not satisfied';
        },
        async () => {
          await fillForm(invalidEmail, validData.password);
          await submitForm();
          return 'Invalid email address';
        }
      ]);
    });

    it('supports keyboard navigation', async () => {
      render(<LoginForm />);
      const loginButton = screen.getByRole('button', { name: /login/i });
      loginButton.focus();
      expect(document.activeElement).toBe(loginButton);
    });
  });
});
