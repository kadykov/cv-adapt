export const mockUser = {
  id: 1,
  email: 'test@example.com',
  created_at: '2024-02-16T00:00:00Z',
  personal_info: null,
};

export const mockAuthResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser,
};
