import {
  createPostHandler,
  createGetHandler,
} from '../../../lib/test/integration/handler-generator';
import { mockJob, mockCompetencesResponse, mockCV } from './fixtures';
import type { components } from '../../../lib/api/types';

type Schema = components['schemas'];

// Success handlers
export const cvGenerationIntegrationHandlers = [
  // Job details handler
  createGetHandler(
    'jobs/:id',
    'JobDescriptionResponse',
    mockJob
  ),

  // Competences generation handler
  createPostHandler(
    'generations/competences',
    'GenerateCompetencesRequest',
    'CoreCompetencesResponse',
    mockCompetencesResponse,
    {
      validateRequest: (data: Schema['GenerateCompetencesRequest']) => {
        return Boolean(data.cv_text && data.job_description);
      },
      errorResponse: {
        status: 500,
        message: 'Failed to generate competences'
      }
    }
  ),

  // CV generation handler
  createPostHandler(
    'generations/cv',
    'GenerateCVRequest',
    'CVDTO',
    mockCV,
    {
      validateRequest: (data: Schema['GenerateCVRequest']) => {
        return Boolean(
          data.cv_text &&
          data.job_description &&
          data.approved_competences?.length &&
          data.personal_info
        );
      },
      errorResponse: {
        status: 500,
        message: 'Failed to generate CV'
      }
    }
  )
];

// Error handlers
export const cvGenerationErrorHandlers = [
  // Job details handler (pass-through)
  createGetHandler(
    'jobs/:id',
    'JobDescriptionResponse',
    mockJob
  ),

  // Failed competences generation with empty response
  createPostHandler(
    'generations/competences',
    'GenerateCompetencesRequest',
    'CoreCompetencesResponse',
    { core_competences: [] },
    {
      validateRequest: () => false,
      errorResponse: {
        status: 500,
        message: 'Failed to generate competences'
      }
    }
  ),

  // Failed CV generation with error
  createPostHandler(
    'generations/cv',
    'GenerateCVRequest',
    'CVDTO',
    {} as Schema['CVDTO'], // Empty CV indicates error
    {
      validateRequest: () => false,
      errorResponse: {
        status: 500,
        message: 'Failed to generate CV'
      }
    }
  )
];
