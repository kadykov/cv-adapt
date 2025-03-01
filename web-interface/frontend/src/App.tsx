import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { Layout } from './routes/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Home } from './routes/Home';
import { Auth } from './routes/Auth';
import { ROUTES } from './routes/paths';
// Import job catalog components
import {
  JobListPage,
  CreateJobPage,
  EditJobPage,
  JobDetailPage,
} from './features/job-catalog/components/JobPages';
// Import detailed CV components
import {
  DetailedCVListPage,
  CreateDetailedCVPage,
  EditDetailedCVPage,
  DetailedCVDetailPage,
} from './features/detailed-cv/components/DetailedCVPages';

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
                <Route path={ROUTES.JOBS.LIST} element={<JobListPage />} />
                <Route path={ROUTES.JOBS.CREATE} element={<CreateJobPage />} />
                <Route
                  path={ROUTES.JOBS.DETAIL(':id')}
                  element={<JobDetailPage />}
                />
                <Route
                  path={ROUTES.JOBS.EDIT(':id')}
                  element={<EditJobPage />}
                />

                {/* Detailed CV routes */}
                <Route
                  path={ROUTES.DETAILED_CVS.LIST}
                  element={<DetailedCVListPage />}
                />
                <Route
                  path={ROUTES.DETAILED_CVS.CREATE}
                  element={<CreateDetailedCVPage />}
                />
                <Route
                  path={ROUTES.DETAILED_CVS.DETAIL(':languageCode')}
                  element={<DetailedCVDetailPage />}
                />
                <Route
                  path={ROUTES.DETAILED_CVS.EDIT(':languageCode')}
                  element={<EditDetailedCVPage />}
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
