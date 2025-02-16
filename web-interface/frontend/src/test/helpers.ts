import { screen, waitForElementToBeRemoved, fireEvent, waitFor } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { JobService } from '../types/services/job-service';
import type { DetailedCVService } from '../types/services/cv-service';
import { createMockJobService, createMockDetailedCVService } from './service-mocks';
import type { ApiResponse } from '../types/api-utils';

/**
 * Wait for the loading state to be removed
 */
export async function waitForLoadingToComplete() {
  await waitForElementToBeRemoved(() => screen.queryByText(/Loading.../i));
}

/**
 * Create an error version of the job service
 */
export function createErrorJobService(error = new Error('Failed to fetch jobs')): JobService {
  const service = createMockJobService([]);
  const errorPromise = Promise.reject(error);
  service.getJobs = vi.fn().mockImplementation(() => errorPromise);
  return service;
}

/**
 * Create an error version of the CV service
 */
export function createErrorCVService(error = new Error('Failed to fetch CVs')): DetailedCVService {
  const service = createMockDetailedCVService([]);
  const errorPromise = Promise.reject(error);
  service.getAllDetailedCVs = vi.fn().mockImplementation(() => errorPromise);
  return service;
}

/**
 * Type guard for checking if a function is a Mock
 */
function isMockFunction(fn: unknown): fn is Mock {
  return typeof fn === 'function' && 'mock' in fn;
}

/**
 * Get mock call count for a function
 */
export function getMockCallCount(fn: unknown): number {
  if (!isMockFunction(fn)) {
    throw new Error('Function is not a mock');
  }
  return fn.mock.calls.length;
}

/**
 * Reset mock function call history
 */
export function resetMockCalls(fn: unknown): void {
  if (!isMockFunction(fn)) {
    throw new Error('Function is not a mock');
  }
  fn.mockClear();
}

/**
 * Track the number of calls to a mock function and assert a difference
 */
export async function expectAdditionalCall(
  fn: Mock,
  action: () => Promise<void> | void,
  expectedAdditionalCalls = 1
): Promise<void> {
  const initialCalls = fn.mock.calls.length;
  await action();
  expect(fn.mock.calls.length).toBe(initialCalls + expectedAdditionalCalls);
}

/**
 * Assert that a service method was called with specific arguments
 */
export function expectServiceCall<T extends JobService | DetailedCVService>(
  service: T,
  methodName: keyof T,
  args?: any[]
): void {
  const method = service[methodName];
  if (!isMockFunction(method)) {
    throw new Error(`Method ${String(methodName)} is not a mock`);
  }
  expect(method).toHaveBeenCalled();
  if (args) {
    expect(method).toHaveBeenCalledWith(...args);
  }
}

/**
 * Reset mock calls for a service method
 */
export function resetServiceCalls<T extends JobService | DetailedCVService>(
  service: T,
  methodName: keyof T
): void {
  const method = service[methodName];
  if (!isMockFunction(method)) {
    throw new Error(`Method ${String(methodName)} is not a mock`);
  }
  method.mockClear();
}

/**
 * Wait for an element with specific text to appear
 */
export async function waitForText(text: string | RegExp) {
  return screen.findByText(text);
}

/**
 * Check if an error message is displayed
 */
export async function expectErrorMessage(message: string | RegExp) {
  const errorElement = await screen.findByRole('alert');
  expect(errorElement).toHaveTextContent(message);
}

/**
 * Get button by name (case insensitive)
 */
export function getButton(name: string | RegExp) {
  return screen.getByRole('button', { name: new RegExp(name, 'i') });
}

/**
 * Get select element by label (case insensitive)
 */
export function getSelect(label: string | RegExp) {
  return screen.getByLabelText(new RegExp(label, 'i'));
}

/**
 * Verify focus order of elements
 */
export async function expectFocusOrder(selectors: string[]) {
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
 * Verify ARIA attributes
 */
export function expectAriaAttributes(element: HTMLElement, attributes: Record<string, string>) {
  Object.entries(attributes).forEach(([attribute, value]) => {
    expect(element).toHaveAttribute(attribute, value);
  });
}

/**
 * Wait for and verify screen reader announcement
 */
export async function expectAnnouncement(text: string | RegExp) {
  const announcement = await screen.findByRole('status');
  expect(announcement).toHaveTextContent(text);
}

/**
 * Test keyboard shortcut
 */
export function triggerKeyboardShortcut(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}) {
  fireEvent.keyDown(document, {
    key,
    ctrlKey: modifiers.ctrl || false,
    shiftKey: modifiers.shift || false,
    altKey: modifiers.alt || false
  });
}

/**
 * Verify element is keyboard focusable
 */
export function expectFocusable(element: HTMLElement) {
  element.focus();
  expect(document.activeElement).toBe(element);
}

/**
 * Wait for focus to be on element matching selector
 */
export async function waitForFocus(selector: string | RegExp) {
  await waitFor(() => {
    const element = screen.getByTestId(selector);
    expect(document.activeElement).toBe(element);
  });
}

/**
 * Check if element is in tab order
 */
export function isInTabOrder(element: HTMLElement) {
  return element.tabIndex >= 0 && !element.hasAttribute('aria-hidden');
}

/**
 * Test modal focus trap
 */
export async function expectModalFocusTrap(modalSelector: string) {
  const modal = screen.getByTestId(modalSelector);
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  // Focus first element
  (focusableElements[0] as HTMLElement).focus();
  expect(document.activeElement).toBe(focusableElements[0]);

  // Tab to last element
  for (let i = 1; i < focusableElements.length; i++) {
    await userEvent.tab();
  }

  // Tab again should cycle back to first element
  await userEvent.tab();
  expect(document.activeElement).toBe(focusableElements[0]);
}

/**
 * Create a success API response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 200
  };
}

/**
 * Create an error response promise
 */
export function createErrorResponse(error: Error): Promise<never> {
  return Promise.reject(error);
}
