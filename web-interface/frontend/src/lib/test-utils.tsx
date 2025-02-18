import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Create a test client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Create a wrapper with necessary providers
export function createTestWrapper() {
  const testQueryClient = createTestQueryClient();

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}
