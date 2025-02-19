import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { Button } from '@headlessui/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-base-200">
          <div className="hero min-h-screen">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">CV Adapt</h1>
                <p className="py-6">
                  Intelligent CV customization and generation with multilingual
                  support
                </p>
                <Button className="btn btn-primary">Get Started</Button>
              </div>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
