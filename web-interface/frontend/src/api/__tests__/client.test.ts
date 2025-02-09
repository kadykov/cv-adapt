import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient } from '../client';

describe('ApiClient', () => {
  const mockToken = 'test-token';
  const mockResponse = { data: 'test' };

  beforeEach(() => {
    // Setup localStorage mock
    localStorage.clear();
    localStorage.setItem('auth_token', mockToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('includes auth token in requests when token exists', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      });
    });

    it('does not include auth token when requiresAuth is false', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test', { requiresAuth: false });

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles missing auth token gracefully', async () => {
      localStorage.clear(); // Remove token
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('throws ApiError for 401 unauthorized responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Unauthorized');
    });

    it('throws ApiError for 403 forbidden responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Forbidden');
    });

    it('throws ApiError with default message when response has no error message', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Request failed');
    });
  });

  describe('HTTP Methods', () => {
    it('makes authenticated POST request with correct body', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const data = { test: 'data' };
      await apiClient.post('/test', data);

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(data),
      });
    });

    it('makes authenticated PUT request with correct body', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const data = { test: 'data' };
      await apiClient.put('/test', data);

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(data),
      });
    });

    it('makes authenticated DELETE request', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      await apiClient.delete('/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      });
    });
  });
});
