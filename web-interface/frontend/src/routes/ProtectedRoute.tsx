import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthState } from '../features/auth/hooks';
import { ROUTES } from './paths';

/**
 * Protected route component that requires authentication.
 * Uses the new React Query-based auth state management.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthState();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span
          className="loading loading-spinner loading-lg"
          role="status"
          aria-label="Loading..."
        ></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect after login
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
