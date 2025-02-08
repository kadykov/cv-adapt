import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { authTestUser } from './utils';
import { server } from './mocks/server';

let api: AxiosInstance;

beforeAll(() => {
  // Start the MSW server
  server.listen();

  api = axios.create({
    baseURL: 'http://localhost:8000',
    validateStatus: () => true,
  });
});

afterAll(() => {
  // Clean up after tests are done
  server.close();
});

afterEach(() => {
  // Reset handlers after each test
  server.resetHandlers();
});

describe('Auth API Integration Tests', () => {
  test('should register a new user', async () => {
    const email = `test${Date.now()}@example.com`;
    const response = await api.post('/v1/auth/register', {
      email,
      password: authTestUser.password,
    });

    if (response.status !== 200) {
      console.error('Registration failed:', response.data);
    }

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('access_token');
    expect(response.data).toHaveProperty('refresh_token');
  });

  test('should not register with existing email', async () => {
    await api.post('/v1/auth/register', {
      email: authTestUser.email,
      password: authTestUser.password,
    });

    const response = await api.post('/v1/auth/register', {
      email: authTestUser.email,
      password: 'differentpassword',
    });

    expect(response.status).toBe(400);
    expect(response.data.detail.message).toBe('Email already registered');
  });

  test('should login with valid credentials', async () => {
    const email = `test${Date.now()}@example.com`;
    await api.post('/v1/auth/register', {
      email,
      password: authTestUser.password,
    });

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', authTestUser.password);
    formData.append('grant_type', 'password');

    const response = await api.post('/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('access_token');
    expect(response.data).toHaveProperty('refresh_token');
  });

  test('should not login with invalid credentials', async () => {
    const formData = new URLSearchParams();
    formData.append('username', authTestUser.email);
    formData.append('password', 'wrongpassword');
    formData.append('grant_type', 'password');

    const response = await api.post('/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    expect(response.status).toBe(401);
    expect(response.data.detail.message).toBe('Incorrect email or password');
  });

  test('should refresh token', async () => {
    const email = `test${Date.now()}@example.com`;
    await api.post('/v1/auth/register', {
      email,
      password: authTestUser.password,
    });

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', authTestUser.password);
    formData.append('grant_type', 'password');

    const loginResponse = await api.post('/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const refreshToken = loginResponse.data.refresh_token;

    const response = await api.post('/v1/auth/refresh', {
      token: refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('access_token');
  });
});
