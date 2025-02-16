import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '../../types/services';
import type { z } from 'zod';
import { schemas } from '../../types/zod-schemas';
import styles from './job-list.module.css';

type JobDescription = z.infer<typeof schemas.JobDescriptionResponse>;

export function JobList() {
  const [languageCode, setLanguageCode] = useState('en');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', languageCode],
    queryFn: () => jobService.getJobs(languageCode)
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Available Jobs</h2>
        <select
          className={styles.languageSelect}
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      {isLoading && (
        <div className={styles.loadingState}>Loading jobs...</div>
      )}

      {error && (
        <div className={styles.errorState}>
          Error loading jobs: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && (
        <div className={styles.jobList}>
          {jobs?.data.map((job: JobDescription) => (
            <div key={job.id} className={styles.jobItem}>
              <h3 className={styles.jobTitle}>{job.title}</h3>
              <p className={styles.jobDescription}>{job.description}</p>
              <div className={styles.meta}>
                <span>Language: {job.language_code}</span>
                <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
