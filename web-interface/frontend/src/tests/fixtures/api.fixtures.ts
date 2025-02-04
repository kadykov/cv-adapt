import type { CVDTO, GenerateCompetencesRequest, GenerateCVRequest } from '../../types/api';

export const samplePersonalInfo = {
  full_name: 'John Doe',
  email: {
    value: 'john@example.com',
    type: 'Email'
  }
};

export const sampleGenerateCompetencesRequest: GenerateCompetencesRequest = {
  cv_text: 'Professional software engineer with 5 years experience',
  job_description: 'Looking for a senior software engineer',
  notes: 'Focus on backend development'
};

export const sampleGenerateCompetencesResponse = {
  competences: [
    'Backend Development',
    'System Architecture',
    'Team Leadership'
  ]
};

export const sampleGenerateCVRequest: GenerateCVRequest = {
  cv_text: 'Professional software engineer with 5 years experience',
  job_description: 'Looking for a senior software engineer',
  personal_info: samplePersonalInfo,
  approved_competences: [
    'Backend Development',
    'System Architecture'
  ],
  notes: 'Focus on technical skills'
};

export const sampleCV: CVDTO = {
  personal_info: samplePersonalInfo,
  title: { text: 'Senior Software Engineer' },
  summary: { text: 'Experienced software engineer with expertise in backend development' },
  core_competences: [
    { text: 'Backend Development' },
    { text: 'System Architecture' }
  ],
  experiences: [{
    company: { name: 'Tech Corp' },
    position: 'Senior Developer',
    start_date: '2020-01-01',
    end_date: '2023-12-31',
    description: 'Led backend development team',
    technologies: ['Node.js', 'Python', 'AWS']
  }],
  education: [{
    university: { name: 'Tech University' },
    degree: 'Computer Science',
    start_date: '2015-01-01',
    end_date: '2019-12-31'
  }],
  skills: [{
    name: 'Programming Languages',
    skills: [{ text: 'Python' }, { text: 'JavaScript' }]
  }],
  language: {
    code: 'en'
  }
};

export const invalidCV = {
  personal_info: {
    email: {
      value: 'john@example.com',
      type: 'Email'
    }
  },
  title: { text: 'Senior Software Engineer' },
  summary: { text: 'Experienced software engineer' },
  core_competences: [
    { text: 'Backend Development' }
  ],
  experiences: [{
    company: { name: 'Tech Corp' },
    position: 'Senior Developer',
    start_date: '2020-01-01'
  }],
  education: [{
    university: { name: 'Tech University' },
    degree: 'Computer Science',
    start_date: '2015-01-01'
  }],
  skills: [{
    name: 'Programming Languages',
    skills: [{ text: 'Python' }]
  }],
  language: {
    code: 'en'
  }
  // Missing required full_name in personal_info
};
