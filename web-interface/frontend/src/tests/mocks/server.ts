import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { jobHandlers } from './handlers/jobs';
import { userHandlers } from './handlers/users';
import { cvHandlers } from './handlers/cvs';

// Set up the MSW server with all handlers
export const server = setupServer(
  ...authHandlers,
  ...jobHandlers,
  ...userHandlers,
  ...cvHandlers
);

// Export handlers for individual test overrides
export { authHandlers, jobHandlers, userHandlers, cvHandlers };
