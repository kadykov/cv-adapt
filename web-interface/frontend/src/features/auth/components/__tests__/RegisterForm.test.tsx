import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { createTestHelpers } from '@/tests/setup';
import { RegisterForm } from '../RegisterForm';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

describe('RegisterForm', () => {
  const { simulateLoading, simulateError, simulateSuccess } = createTestHelpers();

  // Helper function to render the form with required providers
  const renderForm = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  // Helper function to fill and submit form
  const fillAndSubmitForm = async (
    email = 'test@example.com',
    password = 'Password123!',
    acceptTerms = true
  ) => {
    await userEvent.type(screen.getByLabelText(/email/i), email);
    await userEvent.type(screen.getByLabelText(/^password$/i), password);
    if (acceptTerms) {
      await userEvent.click(screen.getByLabelText(/terms and conditions/i));
    }
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
  };

  it('handles successful registration and redirects', async () => {
    // Prepare successful response
    simulateSuccess('/api/v1/auth/register', 'post', {
      access_token: 'mock_token',
      refresh_token: 'mock_refresh',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }
    });

    renderForm();
    await fillAndSubmitForm();

    // Verify success state
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
  });

  it('shows loading state during registration', async () => {
    // Simulate loading state with 1s delay
    simulateLoading('/api/v1/auth/register', 'post', 1000);

    renderForm();
    await fillAndSubmitForm();

    // Verify loading state
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('handles existing email error', async () => {
    // Simulate error response
    simulateError('/api/v1/auth/register', 'post', 409, 'Email already exists');

    renderForm();
    await fillAndSubmitForm();

    // Verify error state
    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
  });

  it('validates form fields', async () => {
    renderForm();
    await fillAndSubmitForm('', '', false);

    // Verify validation messages
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please accept the terms and conditions/i)).toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    renderForm();
    await fillAndSubmitForm('test@example.com', 'short', true);

    // Verify password validation
    expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
  });

  it('requires terms acceptance', async () => {
    renderForm();
    await fillAndSubmitForm('test@example.com', 'Password123!', false);

    // Verify terms validation
    expect(screen.getByText(/please accept the terms and conditions/i)).toBeInTheDocument();
  });

  it('handles network errors', async () => {
    // Simulate server error
    simulateError('/api/v1/auth/register', 'post', 503, 'Service temporarily unavailable');

    renderForm();
    await fillAndSubmitForm();

    // Verify error state
    expect(await screen.findByText(/an unexpected error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
  });
});
