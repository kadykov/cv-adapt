const now = new Date().toISOString();

export const mockJob = {
  id: 1,
  title: 'Software Engineer',
  description: 'Example job description',
  language_code: 'en',
  requirements: [
    'Strong experience with React',
    'TypeScript proficiency',
    'Good communication skills'
  ],
  created_at: now,
  updated_at: now
};
