import { components } from './api-schema';

export const builders = {
  auth: {
    loginResponse: (overrides = {}) => ({
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 1,
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        personal_info: {}
      },
      ...overrides
    } as components['schemas']['AuthResponse'])
  },
  job: {
    response: (overrides = {}) => ({
      id: 1,
      title: 'Software Engineer',
      description: 'Test job description',
      language_code: 'en',
      created_at: new Date().toISOString(),
      updated_at: null,
      ...overrides
    } as components['schemas']['JobDescriptionResponse'])
  }
};
