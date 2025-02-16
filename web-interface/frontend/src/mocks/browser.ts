import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create service worker instance
export const worker = setupWorker(...handlers);

// Re-export everything
export * from './handlers';
