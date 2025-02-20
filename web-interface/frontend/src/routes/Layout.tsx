import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { ROUTES } from './paths';

export function Layout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link to={ROUTES.HOME} className="btn btn-ghost text-xl">
            CV Adapt
          </Link>
        </div>
        <div className="flex-none">
          {isAuthenticated ? (
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
