import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';
import '@testing-library/jest-dom/vitest';
import '@testing-library/jest-dom';

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Export server for custom handler configuration in tests
export { server };

// Re-export createHandlers for use in tests
export { createHandlers } from '@/mocks/handlers';
