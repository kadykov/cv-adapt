import {
  validateCV,
  validateGenerateCompetencesResponse,
  validateGenerateCompetencesRequest,
  validateGenerateCVRequest
} from './api.validation';

describe('API Validation', () => {
  describe('validateGenerateCompetencesResponse', () => {
    it('validates correct competences response', () => {
      const validResponse = {
        competences: ['Python Development', 'API Design']
      };

      expect(() => validateGenerateCompetencesResponse(validResponse)).not.toThrow();
    });

    it('throws on invalid competences response', () => {
      const invalidResponse = {
        competences: [{ text: 'Python Development' }] // Should be string, not object
      };

      expect(() => validateGenerateCompetencesResponse(invalidResponse)).toThrow();
    });
  });

  describe('validateCV', () => {
    it('validates correct CV response', () => {
      const validCV = {
        personal_info: {
          full_name: 'John Doe',
          email: {
            value: 'john@example.com',
            type: 'Email',
          },
        },
        title: { text: 'Software Engineer' },
        summary: { text: 'Experienced software engineer...' },
        core_competences: [{ text: 'Python Development' }],
        experiences: [{
          company: { name: 'Tech Corp' },
          position: 'Senior Developer',
          start_date: '2020-01-01',
        }],
        education: [{
          university: { name: 'University' },
          degree: 'Computer Science',
          start_date: '2015-01-01',
        }],
        skills: [{
          name: 'Programming Languages',
          skills: [{ text: 'Python' }],
        }],
        language: {
          code: 'en',
          name: 'English',
          native_name: 'English',
        },
      };

      expect(() => validateCV(validCV)).not.toThrow();
    });

    it('throws on missing required fields', () => {
      const invalidCV = {
        // Missing personal_info
        title: { text: 'Software Engineer' },
        // Missing other required fields
      };

      expect(() => validateCV(invalidCV)).toThrow();
    });

    it('throws on invalid data types', () => {
      const invalidCV = {
        personal_info: {
          full_name: 123, // Should be string
          email: {
            value: 'john@example.com',
            type: 'Email',
          },
        },
        // ... other required fields ...
      };

      expect(() => validateCV(invalidCV)).toThrow();
    });
  });

  describe('validateGenerateCompetencesRequest', () => {
    it('validates correct request', () => {
      const validRequest = {
        cv_text: 'My CV content',
        job_description: 'Job description',
      };

      expect(() => validateGenerateCompetencesRequest(validRequest)).not.toThrow();
    });

    it('accepts optional notes field', () => {
      const requestWithNotes = {
        cv_text: 'My CV content',
        job_description: 'Job description',
        notes: 'Some additional notes',
      };

      expect(() => validateGenerateCompetencesRequest(requestWithNotes)).not.toThrow();
    });

    it('throws on missing required fields', () => {
      const invalidRequest = {
        // Missing cv_text
        job_description: 'Job description',
      };

      expect(() => validateGenerateCompetencesRequest(invalidRequest)).toThrow();
    });
  });
});
