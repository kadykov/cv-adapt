import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cvService, jobService } from '../../types/services';
import type { z } from 'zod';
import { schemas } from '../../types/zod-schemas';
import styles from './cv-generator.module.css';

type DetailedCV = z.infer<typeof schemas.DetailedCVResponse>;
type JobDescription = z.infer<typeof schemas.JobDescriptionResponse>;
type DetailedCVCreate = z.infer<typeof schemas.DetailedCVCreate>;

export function CVGenerator() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Fetch jobs for the selected language
  const { data: jobs } = useQuery({
    queryKey: ['jobs', selectedLanguage],
    queryFn: () => jobService.getJobs(selectedLanguage)
  });

  // Fetch user's existing CVs
  const { data: userCVs, refetch: refetchCVs } = useQuery({
    queryKey: ['user-cvs'],
    queryFn: () => cvService.getAllDetailedCVs()
  });

  // Mutation for creating/updating CV
  const { mutate: upsertCV } = useMutation({
    mutationFn: (cv: DetailedCVCreate) =>
      cvService.upsertDetailedCV(selectedLanguage, cv),
    onSuccess: () => {
      refetchCVs();
    }
  });

  // Mutation for setting primary CV
  const { mutate: setPrimary } = useMutation({
    mutationFn: (languageCode: string) =>
      cvService.setPrimaryCv(languageCode),
    onSuccess: () => {
      refetchCVs();
    }
  });

  return (
    <div className={styles.cvGenerator}>
      <div className={styles.languageSelector}>
        <h3>Select Language</h3>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <div className={styles.jobSelector}>
        <h3>Select Job Description</h3>
        <select
          value={selectedJobId || ''}
          onChange={(e) => setSelectedJobId(Number(e.target.value) || null)}
        >
          <option value="">Select a job...</option>
          {jobs?.data.map((job: JobDescription) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.existingCvs}>
        <h3>Your CVs</h3>
        <div className={styles.cvList}>
          {userCVs?.data.map((cv: DetailedCV) => (
            <div key={cv.id} className={styles.cvItem}>
              <div className={styles.cvInfo}>
                <span className={styles.language}>{cv.language_code}</span>
                {cv.is_primary && <span className={styles.primaryBadge}>Primary</span>}
              </div>
              <div className={styles.cvActions}>
                {!cv.is_primary && (
                  <button
                    onClick={() => setPrimary(cv.language_code)}
                    className={styles.setPrimaryBtn}
                  >
                    Set as Primary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          disabled={!selectedJobId}
          onClick={() => {
            if (selectedJobId) {
              upsertCV({
                language_code: selectedLanguage,
                content: {}, // This would be filled with actual CV content
                is_primary: !userCVs?.data.length // Make first CV primary
              });
            }
          }}
          className={styles.generateBtn}
        >
          Generate CV
        </button>
      </div>
    </div>
  );
}
