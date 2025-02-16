import type { ReactElement } from 'react';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { TestWrapper } from './TestWrapper';
import { setRequestState } from '../mocks/handlers/test-handlers';

// Create test helpers
export function createTestHelpers() {
  return {
    simulateSuccess: <T extends Record<string, unknown>>(path: string, method: string, data: T) => {
      setRequestState('success', { response: data });
    },
    simulateError: (path: string, method: string, error: { status: number; message: string }) => {
      setRequestState('error', { errorStatus: error.status, errorMessage: error.message });
    },
    simulateLoading: (path: string, method: string, delayMs = 500) => {
      setRequestState('loading', { delay: delayMs });
    }
  };
}

// Test environment
export function createTestEnvironment() {
  return {
    verifyAccessibility: async (ui: ReactElement) => {
      const view = render(ui);
      // Add actual accessibility checks here
      return view;
    },
    verifyAnnouncements: async (announcements: (string | (() => Promise<string>))[]) => {
      for (const announcement of announcements) {
        if (typeof announcement === 'function') {
          const result = await announcement();
          await waitFor(() => {
            const status = screen.getByRole('status');
            expect(status).toHaveTextContent(result);
          });
        } else {
          await waitFor(() => {
            const status = screen.getByRole('status');
            expect(status).toHaveTextContent(announcement);
          });
        }
      }
    }
  };
}

// State expectations
export async function expectLoadingState() {
  await waitFor(() => {
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Logging in...');
  }, { timeout: 2000 });
}

export async function expectErrorState(message: string) {
  await waitFor(() => {
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(message);
  }, { timeout: 2000 });
}

export async function expectSuccessState() {
  await waitFor(() => {
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
    // Should not show loading or error messages
    expect(screen.queryByText(/loading|error/i)).not.toBeInTheDocument();
  }, { timeout: 2000 });
}

// Standard render with providers
export function render(ui: ReactElement) {
  return rtlRender(ui, {
    wrapper: TestWrapper
  });
}

// Re-export test utilities
export * from '@testing-library/react';
