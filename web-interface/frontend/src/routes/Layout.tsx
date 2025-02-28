import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthState, useLogoutMutation } from '../features/auth/hooks';
import { ROUTES } from './paths';
import { Button } from '@headlessui/react';

/**
 * Main layout component that handles navigation and auth state display.
 * Uses React Query-based auth state management.
 */
export function Layout() {
  const { isAuthenticated, isLoading } = useAuthState();
  const navigate = useNavigate();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation(() => {
    navigate(ROUTES.AUTH);
  });

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link to={ROUTES.HOME} className="btn btn-ghost text-xl">
            CV Adapt
          </Link>
        </div>
        <div className="flex-none">
          {isLoading || isLoggingOut ? (
            <span
              className="loading loading-spinner loading-md"
              role="status"
              aria-label="Loading..."
            />
          ) : isAuthenticated ? (
            <>
              <Link to={ROUTES.JOBS.LIST} className="btn btn-ghost">
                Jobs
              </Link>
              <Button
                type="button"
                onClick={() => logout()}
                className="btn btn-ghost"
                disabled={isLoggingOut}
              >
                Logout
              </Button>
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
