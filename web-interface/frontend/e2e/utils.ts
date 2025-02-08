import { test as base, expect } from '@playwright/test';

// Extend base test with custom fixtures
interface TestFixtures {
  cleanDatabase: void;
}

export const test = base.extend<TestFixtures>({
  cleanDatabase: async ({ request }, use) => {
    // Before each test, we ensure we have a clean database state
    const baseUrl = 'http://localhost:8000';

    // Reset database state (this matches our backend's fixture behavior)
    await request.post(`${baseUrl}/test/reset-db`);

    await use(undefined);
  },
});

export { expect };

// API helper functions
type RequestData = Record<string, unknown>;

export async function makeRequest(method: string, url: string, data?: RequestData) {
  const response = await fetch(`http://localhost:8000${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail?.message || 'Request failed');
  }

  return response.json();
}

export const authTestUser = {
  email: 'test@example.com',
  password: 'testPassword123!',
};

export async function registerUser(email: string, password: string) {
  const response = await fetch('http://localhost:8000/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.json();
}
