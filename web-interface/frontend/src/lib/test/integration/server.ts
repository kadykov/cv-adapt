import { setupServer } from 'msw/node';
import { authIntegrationHandlers } from '../../../features/auth/testing/integration-handlers';

// Create base server with all integration test handlers
export const server = setupServer(...authIntegrationHandlers);

// Log request handling for debugging
server.events.on('request:unhandled', ({ request }) => {
  console.warn('MSW unhandled:', request.method, request.url.toString());
});

/**
 * Add additional handlers to the integration test server
 * This can be used to add feature-specific handlers in tests
 */
export function addIntegrationHandlers(
  handlers:
    | Parameters<typeof server.use>[0]
    | Parameters<typeof server.use>[0][],
) {
  if (Array.isArray(handlers)) {
    server.use(...handlers);
  } else {
    server.use(handlers);
  }
}
