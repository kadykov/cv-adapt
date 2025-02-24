import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { Layout } from './routes/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Home } from './routes/Home';
import { Auth } from './routes/Auth';
import { ROUTES } from './routes/paths';
// Import job pages
import { Jobs } from './features/jobs/components/Jobs';

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
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.AUTH} element={<Auth />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.JOBS.LIST} element={<Jobs />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
