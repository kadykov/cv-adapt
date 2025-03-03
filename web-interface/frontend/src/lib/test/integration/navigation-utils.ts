import { waitFor, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { RequestHandler } from 'msw';
import type { RouteObject } from 'react-router-dom';
import type { UserEvent } from '@testing-library/user-event';

export interface NavigationVerifyOptions {
  pathname?: string;
  waitForElement?: {
    role: string;
    name?: RegExp | string;
  };
  waitForElementToBeRemoved?: {
    role: string;
    name?: RegExp | string;
  };
  waitForLoading?: boolean;
}

export interface NavigationAssertOptions extends NavigationVerifyOptions {
  shouldMount?: boolean;
}

export const NavigationTestUtils = {
  /**
   * Verify navigation has completed by checking URL and/or element presence
   */
  verifyNavigation: async (options: NavigationVerifyOptions) => {
    await waitFor(async () => {
      // Verify URL if provided
      if (options.pathname) {
        expect(window.location.pathname).toBe(options.pathname);
      }

      // Verify element presence if specified
      if (options.waitForElement) {
        const { role, name } = options.waitForElement;
        const element = screen.getByRole(role, name ? { name } : undefined);
        expect(element).toBeInTheDocument();
      }

      // Verify element removal if specified
      if (options.waitForElementToBeRemoved) {
        const { role, name } = options.waitForElementToBeRemoved;
        const element = screen.queryByRole(role, name ? { name } : undefined);
        expect(element).not.toBeInTheDocument();
      }

      // Verify loading state cleared if requested
      if (options.waitForLoading) {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      }
    });
  },

  /**
   * Verify element mount/unmount state after navigation
   */
  verifyNavigationResult: async (options: NavigationAssertOptions) => {
    await waitFor(() => {
      if (!options.waitForElement) return;

      const { role, name } = options.waitForElement;
      const element = screen.queryByRole(role, name ? { name } : undefined);

      if (options.shouldMount) {
        expect(element).toBeInTheDocument();
      } else {
        expect(element).not.toBeInTheDocument();
      }
    });
  },

  /**
   * Helper for verifying navigation triggered by a user action
   */
  verifyActionNavigation: async (
    action: () => Promise<void>,
    options: NavigationVerifyOptions,
  ) => {
    await action();
    await NavigationTestUtils.verifyNavigation(options);
  },

  /**
   * Helper for common loading state verification
   */
  waitForLoadingComplete: async () => {
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  },
};

export interface RouteTestOptions {
  initialPath: string;
  authenticatedUser?: boolean;
  queryClient?: QueryClient;
  routes?: RouteObject[];
}

export interface FeatureTestOptions extends RouteTestOptions {
  handlers?: RequestHandler[];
  mockData?: unknown;
}

export interface TestContext {
  user: UserEvent;
  queryClient: QueryClient;
}

// Type guard for element options
export const hasElementOptions = (
  options: NavigationVerifyOptions,
): options is Required<Pick<NavigationVerifyOptions, 'waitForElement'>> => {
  return !!options.waitForElement;
};

// Helper for checking navigation state
export const checkNavigationState = async (
  options: NavigationVerifyOptions,
) => {
  if (options.pathname) {
    expect(window.location.pathname).toBe(options.pathname);
  }
  if (hasElementOptions(options)) {
    const { role, name } = options.waitForElement;
    const element = screen.queryByRole(role, name ? { name } : undefined);
    expect(element).toBeInTheDocument();
  }
};
