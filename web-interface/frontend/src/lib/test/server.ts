import { setupServer } from 'msw/node';
import { handlers } from './handlers';
import { cvGenerationHandlers } from '../../features/cv-generation/testing/handlers';

// Create MSW server with all handlers
export const server = setupServer(...handlers, ...cvGenerationHandlers);
