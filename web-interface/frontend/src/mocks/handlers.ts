import { http, HttpResponse } from 'msw';
import { AuthResponse } from '../features/auth/types';

export const handlers = [
  // Auth handlers
  http.post('/api/v1/auth/login', async () => {
    const mockAuthResponse: AuthResponse = {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'user@example.com',
        created_at: new Date().toISOString(),
        personal_info: null
      }
    };

    return HttpResponse.json(mockAuthResponse);
  }),

  // Jobs handlers
  http.get('/api/v1/jobs', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Software Engineer',
        description: 'Example job description',
        requirements: ['React', 'TypeScript'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  }),

  http.get('/api/v1/jobs/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      title: 'Software Engineer',
      description: 'Example job description',
      requirements: ['React', 'TypeScript'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  })
];
