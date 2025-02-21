import { setupServer } from 'msw/node';
import type { RequestHandler } from 'msw';

// Create base server with empty handlers (will be added per test)
export const server = setupServer();

/**
 * Add handlers to the integration test server
 */
export function addIntegrationHandlers(handlers: RequestHandler[]) {
  server.use(...handlers);
}
