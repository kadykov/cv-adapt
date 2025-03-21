import type { components } from '../../../lib/api/types';

type Schema = components['schemas'];

export const mockJob: Schema['JobDescriptionResponse'] = {
  id: 1,
  title: 'Frontend Developer',
  description: 'Frontend development role',
  language_code: 'en',
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};

export const mockCompetencesResponse: Schema['CoreCompetencesResponse'] = {
  core_competences: [
    'React.js',
    'TypeScript',
    'Frontend Development',
    'UI/UX Design',
  ],
};

// For easier test usage, export competences array directly
export const mockCompetences = mockCompetencesResponse.core_competences;

// Mock CV response using OpenAPI schema type
export const mockCV: Schema['CVDTO'] = {
  personal_info: {
    full_name: 'John Doe',
    email: {
      value: 'john@example.com',
      type: 'email',
      icon: 'email',
      url: 'mailto:john@example.com',
    },
    phone: {
      value: '+1234567890',
      type: 'phone',
      icon: 'phone',
      url: 'tel:+1234567890',
    },
  },
  title: { text: 'Senior Frontend Developer' },
  summary: { text: 'Experienced frontend developer...' },
  core_competences: [
    { text: 'React.js' },
    { text: 'TypeScript' },
    { text: 'Frontend Development' },
  ],
  experiences: [
    {
      company: {
        name: 'Tech Corp',
        location: 'New York',
      },
      position: 'Senior Frontend Developer',
      start_date: '2020-01-01',
      end_date: null,
      description: 'Leading frontend development...',
      technologies: ['React', 'TypeScript'],
    },
  ],
  education: [
    {
      university: {
        name: 'University of Technology',
        location: 'Boston',
      },
      degree: 'Bachelor of Computer Science',
      start_date: '2015-09-01',
      end_date: '2019-06-01',
      description: 'Computer Science major...',
    },
  ],
  skills: [
    {
      name: 'Frontend',
      skills: [{ text: 'React.js' }, { text: 'TypeScript' }],
    },
  ],
  language: { code: 'en' },
};

export const mockGeneratedCV: Schema['GeneratedCVResponse'] = {
  id: 1,
  user_id: 1,
  detailed_cv_id: 1,
  job_description_id: 1,
  language_code: 'en',
  content: {},
  status: 'draft',
  generation_status: 'completed',
  error_message: null,
  generation_parameters: {},
  created_at: '2024-02-17T22:00:00Z',
  updated_at: null,
};
