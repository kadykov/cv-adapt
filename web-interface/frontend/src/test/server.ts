import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers/test-handlers';

const allHandlers = Object.values(handlers).flatMap(group =>
  Object.values(group)
);

export const server = setupServer(...allHandlers);
