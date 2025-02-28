import { setupServer } from 'msw/node';
import { HttpHandler } from 'msw';

// Define handlers array - we'll add handlers as needed per test
const handlers: HttpHandler[] = [];

export const server = setupServer(...handlers);
