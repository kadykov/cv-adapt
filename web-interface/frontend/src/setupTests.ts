import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { cleanup } from '@testing-library/react';

// Enable API mocking before tests
beforeAll(() => {
  // Establish requests interception layer before all tests
  server.listen({
    onUnhandledRequest(req, print) {
      // Log all unhandled requests for debugging
      console.log(`[MSW] Unhandled ${req.method} request to ${req.url}`);
      print.warning();
    },
  });
});

beforeEach(() => {
  // Log all requests for debugging
  server.events.on('request:start', ({ request }) => {
    console.log(`[MSW] ${request.method} ${request.url}`);
  });
});

// Reset any request handlers that may be added during the tests
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  // Cleanup any mounted components
  cleanup();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});
