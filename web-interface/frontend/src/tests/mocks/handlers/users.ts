import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/v1';

interface UserProfile {
  id: number;
  email: string;
  created_at: string;
  personal_info?: {
    full_name: string;
    email: {
      value: string;
      type: 'email';
    };
  };
}

const mockUser: UserProfile = {
  id: 1,
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  personal_info: {
    full_name: 'John Doe',
    email: {
      value: 'john@example.com',
      type: 'email'
    }
  }
};

export const userHandlers = [
  // Get user profile
  http.get(`${API_URL}/user/profile`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Update user profile
  http.put(`${API_URL}/user/profile`, async ({ request }) => {
    const body = await request.json() as { personal_info: UserProfile['personal_info'] };
    const updatedUser = {
      ...mockUser,
      personal_info: body.personal_info
    };
    return HttpResponse.json(updatedUser);
  })
];
