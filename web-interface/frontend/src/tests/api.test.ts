import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { generateCompetences, generateCV, ValidationError, handleApiError } from '../api/cv';
import type { GenerateCompetencesRequest, GenerateCVRequest } from '../types/api';
import {
  validateCV,
  validateGenerateCompetencesResponse,
  validateGenerateCompetencesRequest,
  validateGenerateCVRequest
} from '../validation/api.validation';
import {
  sampleGenerateCompetencesRequest,
  sampleGenerateCompetencesResponse,
  sampleGenerateCVRequest,
  sampleCV,
  invalidCV
} from './fixtures/api.fixtures';

const server = setupServer(
  http.post('http://localhost:8000/api/generate-competences', () => {
    return HttpResponse.json(sampleGenerateCompetencesResponse);
  }),
  http.post('http://localhost:8000/api/generate-cv', () => {
    return HttpResponse.json(sampleCV);
  })
);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe('API Functions', () => {
  describe('generateCompetences', () => {
    test('successfully generates competences', async () => {
      const response = await generateCompetences(sampleGenerateCompetencesRequest);
      expect(response).toEqual(sampleGenerateCompetencesResponse);
    });

    test('handles network error', async () => {
      server.use(
        http.post('http://localhost:8000/api/generate-competences', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(generateCompetences(sampleGenerateCompetencesRequest))
        .rejects.toThrow('HTTP error! status: 500');
    });

    test('handles invalid request data', async () => {
      const invalidRequest = {
        // Missing job_description
        cv_text: 'Professional software engineer'
      };

      await expect(generateCompetences(invalidRequest as unknown as GenerateCompetencesRequest))
        .rejects.toThrow(ValidationError);
    });

    test('handles empty strings in required fields', async () => {
      const invalidRequest = {
        cv_text: '',
        job_description: ''
      };

      await expect(generateCompetences(invalidRequest as unknown as GenerateCompetencesRequest))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('generateCV', () => {
    test('successfully generates CV', async () => {
      const response = await generateCV(sampleGenerateCVRequest);
      expect(response).toEqual(sampleCV);
    });

    test('handles network error', async () => {
      server.use(
        http.post('http://localhost:8000/api/generate-cv', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(generateCV(sampleGenerateCVRequest))
        .rejects.toThrow('HTTP error! status: 500');
    });

    test('handles invalid request data', async () => {
      const invalidRequest = {
        cv_text: 'Professional software engineer',
        job_description: 'Senior role',
        // Missing personal_info
        approved_competences: ['Backend']
      };

      await expect(generateCV(invalidRequest as unknown as GenerateCVRequest))
        .rejects.toThrow(ValidationError);
    });

    test('handles invalid personal info in request', async () => {
      const invalidRequest = {
        cv_text: 'Professional software engineer',
        job_description: 'Senior role',
        personal_info: {
          // Missing required full_name
          email: {
            value: 'test@example.com',
            type: 'Email'
          }
        },
        approved_competences: ['Backend']
      };

      await expect(generateCV(invalidRequest as unknown as GenerateCVRequest))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('handleApiError', () => {
    test('handles ValidationError', () => {
      const error = new ValidationError('Invalid data');
      expect(() => handleApiError(error)).toThrow(ValidationError);
      expect(() => handleApiError(error)).toThrow('Invalid data');
    });

    test('handles generic Error', () => {
      const error = new Error('Network error');
      expect(() => handleApiError(error)).toThrow('API Error: Network error');
    });

    test('handles unknown error', () => {
      expect(() => handleApiError(null)).toThrow('An unknown error occurred');
    });
  });
});

describe('Validation Functions', () => {
  describe('validateCV', () => {
    test('validates correct CV data', () => {
      const result = validateCV(sampleCV);
      expect(result).toEqual(sampleCV);
    });

    test('throws on invalid CV data', () => {
      expect(() => validateCV(invalidCV)).toThrow();
    });
  });

  describe('validateGenerateCompetencesResponse', () => {
    test('validates correct competences response', () => {
      const result = validateGenerateCompetencesResponse(sampleGenerateCompetencesResponse);
      expect(result).toEqual(sampleGenerateCompetencesResponse);
    });

    test('throws on invalid competences response data type', () => {
      expect(() => validateGenerateCompetencesResponse({
        competences: [123] // Should be strings
      })).toThrow();
    });

    test('throws on empty competences array', () => {
      expect(() => validateGenerateCompetencesResponse({
        competences: []
      })).toThrow();
    });

    test('throws on missing competences field', () => {
      expect(() => validateGenerateCompetencesResponse({
        someOtherField: []
      })).toThrow();
    });
  });

  describe('validateGenerateCompetencesRequest', () => {
    test('validates correct request', () => {
      const result = validateGenerateCompetencesRequest(sampleGenerateCompetencesRequest);
      expect(result).toEqual(sampleGenerateCompetencesRequest);
    });

    test('throws on missing required fields', () => {
      expect(() => validateGenerateCompetencesRequest({
        // Missing required fields
      })).toThrow('Required');
    });

    test('throws on empty strings', () => {
      expect(() => validateGenerateCompetencesRequest({
        cv_text: '',
        job_description: '',
      })).toThrow('CV text cannot be empty');
    });

    test('validates with optional notes', () => {
      const requestWithNotes = {
        ...sampleGenerateCompetencesRequest,
        notes: 'Additional notes'
      };
      const result = validateGenerateCompetencesRequest(requestWithNotes);
      expect(result).toEqual(requestWithNotes);
    });
  });

  describe('validateGenerateCVRequest', () => {
    test('validates correct CV request', () => {
      const result = validateGenerateCVRequest(sampleGenerateCVRequest);
      expect(result).toEqual(sampleGenerateCVRequest);
    });

    test('throws on missing required fields', () => {
      expect(() => validateGenerateCVRequest({
        // Missing required fields
      })).toThrow('Required');
    });

    test('throws on empty strings', () => {
      expect(() => validateGenerateCVRequest({
        cv_text: '',
        job_description: '',
        personal_info: sampleGenerateCVRequest.personal_info,
        approved_competences: ['Backend']
      })).toThrow('CV text cannot be empty');
    });

    test('throws on empty approved competences array', () => {
      expect(() => validateGenerateCVRequest({
        ...sampleGenerateCVRequest,
        approved_competences: []
      })).toThrow('At least one approved competence is required');
    });

    test('throws on empty string in approved competences', () => {
      expect(() => validateGenerateCVRequest({
        ...sampleGenerateCVRequest,
        approved_competences: ['']
      })).toThrow();
    });

    test('allows optional fields to be undefined', () => {
      const requestWithoutOptionals = {
        ...sampleGenerateCVRequest,
        notes: undefined
      };
      const result = validateGenerateCVRequest(requestWithoutOptionals);
      expect(result).toEqual(requestWithoutOptionals);
    });
  });
});
