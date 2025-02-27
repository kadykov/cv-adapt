import { describe, expect, it } from 'vitest';
import { getTestApiUrl, TEST_BASE_URL } from '../url-helper';
import { BASE_PATH } from '../../api/config';

describe('url-helper', () => {
  describe('getTestApiUrl', () => {
    it('should generate correct URL with clean path', () => {
      expect(getTestApiUrl('users')).toBe(`${BASE_PATH}/users`);
    });

    it('should handle path with leading slash', () => {
      expect(getTestApiUrl('/users')).toBe(`${BASE_PATH}/users`);
    });

    it('should handle path with trailing slash', () => {
      expect(getTestApiUrl('users/')).toBe(`${BASE_PATH}/users`);
    });

    it('should handle path with multiple slashes', () => {
      expect(getTestApiUrl('//users//')).toBe(`${BASE_PATH}/users`);
    });

    it('should throw error for empty path', () => {
      expect(() => getTestApiUrl('')).toThrow('Path cannot be empty');
    });

    it('should throw error for path with only slashes', () => {
      expect(() => getTestApiUrl('/')).toThrow(
        'Path cannot consist only of slashes',
      );
    });
  });

  describe('TEST_BASE_URL', () => {
    it('should match BASE_PATH', () => {
      expect(TEST_BASE_URL).toBe(BASE_PATH);
    });

    it('should have correct format', () => {
      expect(TEST_BASE_URL).toBe('/v1/api');
    });
  });
});
