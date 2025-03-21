// Components
export { PersonalInfo } from './PersonalInfo';
export { Experience } from './Experience';
export { Education } from './Education';
export { CoreCompetences } from './CoreCompetences';

// Props
export type { PersonalInfoProps } from './PersonalInfo';
export type { ExperienceProps } from './Experience';
export type { EducationProps } from './Education';
export type { CoreCompetencesProps } from './CoreCompetences';

// API Types
export type {
  PersonalInfoDTO,
  ContactDTO,
  CoreCompetenceDTO,
  EducationDTO,
  ExperienceDTO,
  InstitutionDTO,
} from '@/lib/api/generated-types';

// Component collection for convenience
import { PersonalInfo } from './PersonalInfo';
import { Experience } from './Experience';
import { Education } from './Education';
import { CoreCompetences } from './CoreCompetences';

export const CVSections = {
  PersonalInfo,
  Experience,
  Education,
  CoreCompetences,
} as const;
