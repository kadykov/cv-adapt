import type { z } from 'zod';
import { schemas } from '../types/zod-schemas';

type CVContent = {
  title: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate: string;
  }>;
};

// Mock CV content structure
export const mockCVContent: CVContent = {
  title: 'Senior Software Engineer',
  summary: 'Experienced software engineer with focus on frontend development',
  skills: ['TypeScript', 'React', 'Node.js', 'GraphQL'],
  experience: [
    {
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      startDate: '2020-01',
      description: 'Led development of core frontend applications'
    },
    {
      title: 'Software Engineer',
      company: 'Startup Inc',
      startDate: '2018-01',
      endDate: '2019-12',
      description: 'Full-stack development with React and Node.js'
    }
  ],
  education: [
    {
      degree: 'Bachelor of Computer Science',
      institution: 'Tech University',
      graduationDate: '2018'
    }
  ]
};

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: new Date().toISOString()
} as const;

export const mockAuth = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser
} as const;
