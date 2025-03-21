import { http, HttpResponse } from 'msw';
import { getTestApiUrl } from '../../../lib/test/url-helper';
import { mockCompetencesResponse, mockCV, mockGeneratedCV } from './fixtures';

export const cvGenerationHandlers = [
  // Original handlers
  // Competences generation handler
  http.post(getTestApiUrl('generations/competences'), () => {
    return HttpResponse.json(mockCompetencesResponse);
  }),

  // CV generation handler
  http.post(getTestApiUrl('generations/cv'), () => {
    return HttpResponse.json(mockCV);
  }),

  // Generated CV status handler
  http.get(getTestApiUrl('generations/:id/generation-status'), () => {
    return HttpResponse.json({
      cv_id: mockGeneratedCV.id,
      status: 'completed',
      error: null,
    });
  }),

  // New handlers matching routes in useCVGenerationFlow
  // Generate competences
  http.post('/api/generate-competences', () => {
    return HttpResponse.json(mockCompetencesResponse);
  }),

  // Generate CV
  http.post('/api/generate-cv', () => {
    return HttpResponse.json(mockCV);
  }),

  // Update CV
  http.put('/api/generated-cvs/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockCV,
      id: Number(params.id),
    });
  }),

  // Error handlers - using schema-based types
  http.post(
    getTestApiUrl('generations/competences'),
    () => {
      return new HttpResponse(
        JSON.stringify({
          message: 'Failed to generate competences',
          code: 'GENERATION_ERROR',
        }),
        { status: 500 },
      );
    },
    { once: true },
  ), // Use once to allow successful requests after error

  http.post(
    getTestApiUrl('generations/cv'),
    () => {
      return new HttpResponse(
        JSON.stringify({
          message: 'Failed to generate CV',
          code: 'GENERATION_ERROR',
        }),
        { status: 500 },
      );
    },
    { once: true },
  ), // Use once to allow successful requests after error
];
