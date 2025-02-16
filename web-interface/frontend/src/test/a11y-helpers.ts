import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { ByRoleOptions } from '@testing-library/dom';

/**
 * Accessibility test utils
 */

export interface A11yVerificationOptions {
  focusOrder?: ReadonlyArray<string>;
  ariaDescriptions?: Record<string, string>;
  ariaLabels?: Record<string, string>;
  ariaLive?: boolean;
  requiredControls?: ReadonlyArray<string>;
}

/**
 * Helper to verify all accessibility requirements for a component
 */
export async function verifyAccessibility(
  view: RenderResult,
  options: A11yVerificationOptions = {}
) {
  // Check focus order if specified
  if (options.focusOrder) {
    await verifyFocusOrder([...options.focusOrder]);
  }

  // Check ARIA descriptions
  if (options.ariaDescriptions) {
    verifyAriaDescriptions(options.ariaDescriptions);
  }

  // Check ARIA labels
  if (options.ariaLabels) {
    verifyAriaLabels(options.ariaLabels);
  }

  // Check live regions
  if (options.ariaLive) {
    verifyLiveRegions();
  }

  // Check required form controls
  if (options.requiredControls) {
    verifyRequiredControls([...options.requiredControls]);
  }

  // Basic accessibility checks that always run
  verifyBasicA11y();
}

/**
 * Verify elements receive focus in correct order
 */
async function verifyFocusOrder(selectors: string[]) {
  const elements = selectors.map(selector => screen.getByTestId(selector));

  // Focus first element
  elements[0].focus();
  expect(document.activeElement).toBe(elements[0]);

  // Tab through elements
  for (let i = 1; i < elements.length; i++) {
    await userEvent.tab();
    expect(document.activeElement).toBe(elements[i]);
  }
}

/**
 * Verify ARIA descriptions are present
 */
function verifyAriaDescriptions(descriptions: Record<string, string>) {
  Object.entries(descriptions).forEach(([selector, description]) => {
    const element = screen.getByTestId(selector);
    expect(element).toHaveAccessibleDescription(description);
  });
}

/**
 * Verify ARIA labels are present
 */
function verifyAriaLabels(labels: Record<string, string>) {
  Object.entries(labels).forEach(([selector, label]) => {
    const element = screen.getByTestId(selector);
    expect(element).toHaveAccessibleName(label);
  });
}

/**
 * Verify live regions are properly configured
 */
function verifyLiveRegions() {
  const liveRegions = screen.queryAllByRole('status');
  liveRegions.forEach(region => {
    expect(region).toHaveAttribute('aria-live');
  });

  const alerts = screen.queryAllByRole('alert');
  alerts.forEach(alert => {
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
}

/**
 * Verify required form controls are properly marked
 */
function verifyRequiredControls(selectors: string[]) {
  selectors.forEach(selector => {
    const control = screen.getByTestId(selector);
    expect(control).toHaveAttribute('aria-required', 'true');

    // Also check for visual indication
    expect(control).toHaveAttribute('required');
  });
}

/**
 * Basic accessibility checks that should pass for all components
 */
function verifyBasicA11y() {
  // All images have alt text
  const images = screen.queryAllByRole('img');
  images.forEach(img => {
    expect(img).toHaveAttribute('alt');
  });

  // All buttons have accessible names
  const buttons = screen.queryAllByRole('button');
  buttons.forEach(button => {
    expect(button).toHaveAccessibleName();
  });

  // All form controls have labels
  const formRoles = ['textbox', 'combobox', 'checkbox', 'radio'] as const;
  formRoles.forEach(role => {
    const controls = screen.queryAllByRole(role);
    controls.forEach(control => {
      expect(control).toHaveAccessibleName();
    });
  });
}

type AnnouncementAssertion = string | (() => Promise<string>);

/**
 * Wait for and verify screen reader announcements
 */
export async function verifyAnnouncements(expectedAnnouncements: ReadonlyArray<AnnouncementAssertion>) {
  for (const announcement of expectedAnnouncements) {
    if (typeof announcement === 'string') {
      await waitFor(() => {
        const messages = screen.queryAllByRole('status')
          .map(el => el.textContent)
          .filter(Boolean);
        expect(messages).toContain(announcement);
      });
    } else {
      const expectedMessage = await announcement();
      await waitFor(() => {
        const messages = screen.queryAllByRole('status')
          .map(el => el.textContent)
          .filter(Boolean);
        expect(messages).toContain(expectedMessage);
      });
    }
  }
}

/**
 * Verify keyboard navigation within a container
 */
export function verifyKeyboardNavigation(containerSelector: string) {
  const container = screen.getByTestId(containerSelector);
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Verify all focusable elements can receive focus
  focusableElements.forEach(el => {
    (el as HTMLElement).focus();
    expect(document.activeElement).toBe(el);
  });
}

/**
 * Create a keyboard event with modifiers
 */
export function createKeyboardEvent(
  key: string,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): { type: 'keydown' } & KeyboardEventInit {
  return {
    key,
    type: 'keydown',
    ctrlKey: modifiers.ctrl || false,
    shiftKey: modifiers.shift || false,
    altKey: modifiers.alt || false,
    bubbles: true,
    cancelable: true
  };
}

/**
 * Test a keyboard shortcut
 */
export function testKeyboardShortcut(
  key: string,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {},
  expectedFocusSelector: string
) {
  const event = createKeyboardEvent(key, modifiers);
  fireEvent.keyDown(document, event);

  const expectedElement = screen.getByTestId(expectedFocusSelector);
  expect(document.activeElement).toBe(expectedElement);
}
