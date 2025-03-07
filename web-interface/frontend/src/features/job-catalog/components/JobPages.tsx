import { useParams, useNavigate } from 'react-router-dom';
import { JobForm } from './JobForm';
import { JobDetail } from './JobDetail';
import { JobList } from './JobList';
import { ROUTES } from '../../../routes/paths';
import { useJob } from '../hooks/useJob';
import { LanguageCode } from '@/lib/language/types';

// Wrapper for JobList with navigation
export function JobListPage() {
  const navigate = useNavigate();
  return (
    <JobList onJobSelect={(jobId) => navigate(ROUTES.JOBS.DETAIL(jobId))} />
  );
}

// Wrapper for the JobForm with required props
export function CreateJobPage() {
  const navigate = useNavigate();
  return (
    <JobForm
      mode="create"
      onSuccess={() => {
        navigate(ROUTES.JOBS.LIST);
      }}
      onCancel={() => navigate(ROUTES.JOBS.LIST)}
    />
  );
}

// Wrapper for the edit mode of JobForm
export function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = parseInt(id!, 10);

  const { data: job, isLoading } = useJob(jobId); // Fetch job data using useJob hook

  if (isLoading || !job) {
    return (
      <div className="text-center py-8">
        <span
          role="status"
          className="loading loading-spinner loading-lg"
        ></span>
      </div>
    );
  }

  return (
    <JobForm
      mode="edit"
      jobId={jobId}
      initialData={{ ...job, language_code: job.language_code as LanguageCode }} // Cast language_code to LanguageCode
      onSuccess={() => navigate(ROUTES.JOBS.DETAIL(jobId))}
      onCancel={() => navigate(ROUTES.JOBS.DETAIL(jobId))}
    />
  );
}

// Wrapper for JobDetail with parsed ID
export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = parseInt(id!, 10);

  return (
    <JobDetail id={jobId} onEdit={() => navigate(ROUTES.JOBS.EDIT(jobId))} />
  );
}
