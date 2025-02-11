import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/context/AuthContext';

export function JobsPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side only code
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('JobsPage state:', {
      isLoading,
      hasUser: !!user,
      isAuthenticated,
      mounted,
      redirecting
    });

    // Only handle auth check after initial mount and loading is complete
    if (mounted && !isLoading && !isAuthenticated && !redirecting) {
      console.log('No authenticated user found, initiating redirect to login');
      setRedirecting(true);
      // Use timeout to prevent immediate redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }, [isLoading, isAuthenticated, mounted, redirecting]);

  if (!mounted || isLoading) {
    console.log('Showing loading state');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, showing placeholder');
    return <div className="min-h-screen"></div>;
  }

  const handleLogout = async () => {
    console.log('Handling logout');
    await logout();
    console.log('Logout complete, redirecting to login');
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto p-4">
      <header className="bg-primary text-primary-content p-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to Jobs Page</h2>
        <p>You are successfully logged in!</p>
      </div>
    </div>
  );
}
