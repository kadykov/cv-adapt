import { useParams, useNavigate } from 'react-router-dom';
import { JobForm } from './JobForm';
import { JobDetail } from './JobDetail';
import { ROUTES } from '../../../routes/paths';

// Wrapper for the JobForm with required props
export function CreateJobPage() {
  const navigate = useNavigate();
  return (
    <JobForm
      mode="create"
      onSuccess={() => navigate(ROUTES.JOBS.LIST)}
      onCancel={() => navigate(ROUTES.JOBS.LIST)}
    />
  );
}

// Wrapper for the edit mode of JobForm
export function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = parseInt(id!, 10);

  return (
    <JobForm
      mode="edit"
      onSuccess={() => navigate(ROUTES.JOBS.DETAIL(jobId))}
      onCancel={() => navigate(ROUTES.JOBS.DETAIL(jobId))}
    />
  );
}

// Wrapper for JobDetail with parsed ID
export function JobDetailPage() {
  const { id } = useParams();
  const jobId = parseInt(id!, 10);

  return <JobDetail id={jobId} />;
}
