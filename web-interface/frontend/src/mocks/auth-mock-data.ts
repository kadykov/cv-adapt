const now = new Date().toISOString();

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: now,
  personal_info: {
    full_name: 'John Doe',
    email: {
      value: 'test@example.com',
      type: 'email'
    }
  }
};

export const mockAuthResponse = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
  user: mockUser
};
