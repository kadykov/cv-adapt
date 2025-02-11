const now = new Date().toISOString();

export const mockDetailedCV = {
  id: 1,
  user_id: 1,
  language_code: 'en',
  content: {
    summary: 'Experienced software engineer',
    skills: ['React', 'TypeScript', 'Python']
  },
  is_primary: true,
  created_at: now,
  updated_at: now
};

export const mockGeneratedCV = {
  id: 1,
  user_id: 1,
  detailed_cv_id: 1,
  job_description_id: 1,
  language_code: 'en',
  content: {
    summary: 'Tailored for software engineering role',
    skills: ['React', 'TypeScript']
  },
  created_at: now
};
