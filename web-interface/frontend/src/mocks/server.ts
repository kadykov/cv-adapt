import { setupServer } from 'msw/node';
import { defaultHandlers } from './handlers';

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...defaultHandlers);
