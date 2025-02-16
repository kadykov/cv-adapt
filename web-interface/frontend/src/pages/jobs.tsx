import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsService, Job } from '../api/services/JobsService';
import { ApiError } from '../api/core/ApiError';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const jobsService = new JobsService();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
      }
    };

    checkAuth();
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobsService.getJobs();
      setJobs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: number) => {
    try {
      setError(null);
      await jobsService.deleteJob(id);
      setJobs(jobs.filter(job => job.id !== id));
      setShowDeleteDialog(false);
      setJobToDelete(null);
      setSuccessMessage('Job deleted successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleDeleteClick = (id: number) => {
    setJobToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (jobToDelete) {
      deleteJob(jobToDelete);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setJobToDelete(null);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/jobs/${id}`);
  };

  const handleCreateJob = () => {
    navigate('/jobs/create');
  };

  const filteredJobs = selectedLanguage === 'all'
    ? jobs
    : jobs.filter(job => job.language_code === selectedLanguage);

  if (loading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div>
      <div className="header">
        <h1>Jobs List</h1>
        <button onClick={handleCreateJob}>Create New Job</button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="alert">
          {successMessage}
        </div>
      )}

      <div className="filters">
        <label htmlFor="language-select">Language: </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <div>No jobs found</div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p>Language: {job.language_code}</p>
              <div className="job-actions">
                <button onClick={() => handleViewDetails(job.id)}>View Details</button>
                <button onClick={() => handleDeleteClick(job.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteDialog && (
        <div className="delete-dialog" role="dialog" aria-labelledby="delete-dialog-title">
          <h2 id="delete-dialog-title">Confirm Deletion</h2>
          <p>Are you sure you want to delete this job?</p>
          <div className="dialog-actions">
            <button onClick={handleConfirmDelete}>Confirm</button>
            <button onClick={handleCancelDelete}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
