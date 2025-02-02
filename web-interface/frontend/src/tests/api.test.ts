import { CVDTO, GenerateCompetencesResponse, CoreCompetenceDTO } from '../types/api';

describe('API Response Type Tests', () => {
  test('CV response matches CVDTO interface', () => {
    // Example CV response from API
    const cvResponse: CVDTO = {
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

    // TypeScript will ensure this matches the interface
    expect(cvResponse.personal_info.full_name).toBe('John Doe');
  });

  test('Generate competences response matches interface', () => {
    // Example competences response
    const competencesResponse: GenerateCompetencesResponse = {
      competences: ['Python Development', 'API Design'],
    };

    // TypeScript will ensure this matches the interface
    expect(Array.isArray(competencesResponse.competences)).toBe(true);
  });

  test('Core competence is always a string', () => {
    // This should cause a TypeScript error if text is not a string
    const competence: CoreCompetenceDTO = {
      text: 'Python Development', // This works
      // text: { name: 'Python Development' }, // This would cause TypeScript error
    };

    expect(typeof competence.text).toBe('string');
  });
});
