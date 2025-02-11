import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { JobList } from '../features/job-catalog/components/JobList';

export function JobsPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen"></div>;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      <JobList />
    </div>
  );
}

export default JobsPage;
