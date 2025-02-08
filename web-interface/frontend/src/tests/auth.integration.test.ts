import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';

const API_URL = 'http://localhost:8000';

const testUser = {
  email: 'test@example.com',
  password: 'testPassword123!'
};

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    // Reset database before each test
    await request(API_URL)
      .post('/test/reset-db')
      .expect(200);
  });

  it('should register a new user successfully', async () => {
    const response = await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.user.email).toBe(testUser.email);
  });

  it('should not register with existing email', async () => {
    // First registration
    await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(200);

    // Try to register again with same email
    const response = await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(400);

    expect(response.body.detail.message).toContain('Email already registered');
  });

  it('should login successfully with valid credentials', async () => {
    // Register first
    await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(200);

    // Try logging in
    const response = await request(API_URL)
      .post('/v1/auth/login')
      .type('form')
      .send({
        username: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.user.email).toBe(testUser.email);
  });

  it('should not login with invalid credentials', async () => {
    // Register first
    await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(200);

    // Try logging in with wrong password
    const response = await request(API_URL)
      .post('/v1/auth/login')
      .type('form')
      .send({
        username: testUser.email,
        password: 'wrongpassword',
      })
      .expect(401);

    expect(response.body.detail.message).toContain('Incorrect email or password');
  });

  it('should handle token refresh', async () => {
    // Register and login to get tokens
    await request(API_URL)
      .post('/v1/auth/register')
      .send(testUser)
      .expect(200);

    const loginResponse = await request(API_URL)
      .post('/v1/auth/login')
      .type('form')
      .send({
        username: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const refreshToken = loginResponse.body.refresh_token;

    // Try refreshing token
    const response = await request(API_URL)
      .post('/v1/auth/refresh')
      .send({ token: refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.user.email).toBe(testUser.email);
  });
});
