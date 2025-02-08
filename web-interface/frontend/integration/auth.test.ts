import { test, expect } from '@playwright/test';
import axios from 'axios';
import { authTestUser } from '../e2e/utils';

const API_URL = 'http://localhost:8000';

test.describe('Auth API Integration', () => {
  const api = axios.create({
    baseURL: API_URL,
    validateStatus: () => true, // Don't throw on any status
  });

  test('should register a new user', async () => {
    // Use a timestamp to ensure unique email
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
    // First registration
    await api.post('/v1/auth/register', {
      email: authTestUser.email,
      password: authTestUser.password,
    });

    // Try registering again with same email
    const response = await api.post('/v1/auth/register', {
      email: authTestUser.email,
      password: 'differentpassword',
    });

    expect(response.status).toBe(400);
    expect(response.data.detail.message).toBe('Email already registered');
  });

  test('should login with valid credentials', async () => {
    // Register first
    const email = `test${Date.now()}@example.com`;
    await api.post('/v1/auth/register', {
      email,
      password: authTestUser.password,
    });

    // Backend OAuth2 login requires x-www-form-urlencoded format with specific fields:
    // - username: the user's email
    // - password: the user's password
    // - grant_type: must be 'password' for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append('username', email);  // Note: Backend expects 'username' field for the email
    formData.append('password', authTestUser.password);
    formData.append('grant_type', 'password');  // Required for OAuth2 password flow

    const response = await api.post('/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',  // Required format for OAuth2
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
    // Register and login first to get tokens
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

    // Try refreshing token
    const response = await api.post('/v1/auth/refresh', {
      token: refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('access_token');
  });
});
