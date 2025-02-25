import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { ROUTES } from './paths';
import { useAuthStateListener } from '../features/auth/hooks/useAuthStateListener';

export function Layout() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  // Listen for auth state changes
  useAuthStateListener();

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link to={ROUTES.HOME} className="btn btn-ghost text-xl">
            CV Adapt
          </Link>
        </div>
        <div className="flex-none">
          {isLoading ? (
            <span
              className="loading loading-spinner loading-md"
              role="status"
              aria-label="Loading authentication state..."
            />
          ) : isAuthenticated ? (
            <>
              <Link to={ROUTES.JOBS.LIST} className="btn btn-ghost">
                Jobs
              </Link>
              <button onClick={logout} className="btn btn-ghost">
                Logout
              </button>
            </>
          ) : (
            <Link to={ROUTES.AUTH} className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
