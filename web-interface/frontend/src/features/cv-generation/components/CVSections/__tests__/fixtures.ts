import type {
  PersonalInfoDTO,
  ContactDTO,
  CoreCompetenceDTO,
  ExperienceDTO,
  EducationDTO,
} from '@/lib/api/generated-types';

export const mockContact: ContactDTO = {
  type: 'email',
  value: 'john@example.com',
  icon: 'mail',
  url: 'mailto:john@example.com',
};

export const mockPersonalInfo: PersonalInfoDTO = {
  full_name: 'John Doe',
  email: { ...mockContact },
  phone: {
    type: 'phone',
    value: '+1234567890',
    icon: 'phone',
  },
  location: {
    type: 'location',
    value: 'New York, USA',
    icon: 'map-pin',
  },
  linkedin: {
    type: 'linkedin',
    value: 'johndoe',
    url: 'https://linkedin.com/in/johndoe',
    icon: 'linkedin',
  },
  github: null,
};

export const mockCoreCompetences: CoreCompetenceDTO[] = [
  { text: 'React Development' },
  { text: 'TypeScript' },
  { text: 'Test-Driven Development' },
  { text: 'CI/CD' },
];

export const mockExperience: ExperienceDTO = {
  position: 'Senior Software Engineer',
  company: {
    name: 'Tech Corp',
    location: 'San Francisco, CA',
    description: 'Leading tech company',
  },
  start_date: '2020-01-15',
  end_date: '2023-06-30',
  description: 'Led development of key features',
  technologies: ['React', 'TypeScript', 'Node.js'],
};

export const mockEducation: EducationDTO = {
  university: {
    name: 'MIT',
    location: 'Cambridge, MA',
    description: 'Leading engineering institution',
  },
  degree: 'Master of Computer Science',
  start_date: '2018-09-01',
  end_date: '2020-05-15',
  description: 'Specialized in Machine Learning and Distributed Systems',
};

export function createMinimalEducation(): EducationDTO {
  return {
    university: { name: 'Local College' },
    degree: 'Bachelor of Arts',
    start_date: '2015-09-01',
    description: 'General studies',
  };
}

export function createMinimalExperience(): ExperienceDTO {
  return {
    position: 'Developer',
    company: { name: 'Small Corp' },
    start_date: '2022-01-01',
    description: 'Basic role',
  };
}

export function createCurrentPosition(exp: ExperienceDTO): ExperienceDTO {
  return {
    ...exp,
    end_date: undefined,
  };
}

export function createMinimalPersonalInfo(): PersonalInfoDTO {
  return {
    full_name: 'John Smith',
    email: {
      type: 'email',
      value: 'john@example.com',
    },
  };
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}
