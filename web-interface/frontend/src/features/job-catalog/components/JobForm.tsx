import { useState } from 'react';
import type { JobDescriptionResponse, JobDescriptionCreate, JobDescriptionUpdate } from '../../../types/api';
import { api } from '../../../api';
import { Link } from 'react-router-dom';

interface JobFormProps {
  job?: JobDescriptionResponse;
  onSuccess?: (job: JobDescriptionResponse) => void;
  onError?: (error: string) => void;
}

export function JobForm({ job, onSuccess, onError }: JobFormProps) {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    language_code: job?.language_code || 'en',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result: JobDescriptionResponse;

      if (job) {
        // Update existing job
        const updateData: JobDescriptionUpdate = {
          title: formData.title || undefined,
          description: formData.description || undefined,
        };
        result = await api.jobs.updateJob(job.id, updateData);
      } else {
        // Create new job
        const createData: JobDescriptionCreate = {
          title: formData.title,
          description: formData.description,
          language_code: formData.language_code,
        };
        result = await api.jobs.createJob(createData);
      }

      onSuccess?.(result);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="textarea textarea-bordered w-full h-32"
          required
        />
      </div>

      {!job && (
        <div>
          <label htmlFor="language" className="label">
            Language
          </label>
          <select
            id="language"
            value={formData.language_code}
            onChange={(e) => setFormData((prev) => ({ ...prev, language_code: e.target.value }))}
            className="select select-bordered w-full"
            required
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="es">Spanish</option>
            <option value="it">Italian</option>
          </select>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link to="/jobs" className="btn">
          Cancel
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}
