import React from "react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string; // URL to redirect to if not authenticated
}

export function ProtectedRoute({ children, fallback = "/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Using Astro's client-side navigation
      window.location.href = fallback;
    }
  }, [isLoading, isAuthenticated, fallback]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return <>{children}</>;
}
