import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function Layout(): JSX.Element {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsLoggedOut(true);
  };

  if (isLoggedOut) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost normal-case text-xl">
            CV Adapter
          </Link>
        </div>
        <div className="flex-none">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="btn btn-ghost">
              Logout
            </button>
          ) : location.pathname !== '/login' && (
            <Link to="/login" className="btn btn-ghost">
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>

      <footer className="footer footer-center p-4 bg-base-200 text-base-content">
        <div>
          <p>CV Adapter © 2024</p>
        </div>
      </footer>
    </div>
  );
}
