import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { ROUTES } from './paths';
import { useAuthStateListener } from '../features/auth/hooks/useAuthStateListener';

export function Layout() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  // Listen for auth state changes and force re-render when they occur
  const { lastEvent } = useAuthStateListener();

  // Use event state if available, otherwise fall back to direct auth state
  const showAuthenticatedUI = lastEvent?.isAuthenticated ?? isAuthenticated;

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
          ) : showAuthenticatedUI ? (
            <>
              <Link to={ROUTES.JOBS.LIST} className="btn btn-ghost">
                Jobs
              </Link>
              <button
                type="button"
                onClick={async () => {
                  // First update local state through event dispatch
                  window.dispatchEvent(
                    new CustomEvent('auth-state-change', {
                      detail: { isAuthenticated: false, user: null },
                    }),
                  );
                  // Then initiate logout process
                  try {
                    await logout();
                  } catch {
                    // Even if logout fails, we keep the UI in logged out state
                    // as we've already cleared tokens
                  }
                }}
                className="btn btn-ghost"
              >
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
