import '@testing-library/jest-dom';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Stub ResizeObserver for tests
global.ResizeObserver = ResizeObserverStub;

// Setup MSW
import { server } from './server';
// Enable request debugging
beforeAll(() => server.listen({
  onUnhandledRequest: (req) => {
    console.error('Found an unhandled %s request to %s', req.method, req.url);
  }
}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
