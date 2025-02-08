import { test as base, expect } from '@playwright/test';

// Test user configuration for auth flow tests
export const authTestUser = {
  email: `test${Date.now()}@example.com`,  // Unique email to avoid conflicts
  password: 'Password123!',  // Strong password that meets requirements
};

// Re-export test and expect for convenience
export const test = base;
export { expect };
