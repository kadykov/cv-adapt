import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function Layout(): JSX.Element {
  const { isAuthenticated, logout } = useAuth();
  const currentPath = window.location.pathname;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <button onClick={handleHome} className="btn btn-ghost normal-case text-xl">CV Adapter</button>
        </div>
        <div className="flex-none">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="btn btn-ghost">
              Logout
            </button>
          ) : currentPath !== '/login' && (
            <button onClick={handleLogin} className="btn btn-ghost">
              Login
            </button>
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
