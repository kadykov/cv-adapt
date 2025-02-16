export const mockAuthResponse = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
  user: {
    id: 1,
    email: "test@example.com",
    created_at: new Date().toISOString(),
    personal_info: null
  }
};
