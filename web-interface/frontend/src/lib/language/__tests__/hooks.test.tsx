import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLanguageAdapter } from '../hooks';
import { LanguageCode } from '../types';
import type { components } from '@/lib/api/generated-types';

describe('useLanguageAdapter', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toApi', () => {
    test('converts valid language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      expect(result.current.toApi(LanguageCode.ENGLISH)).toBe('en');
      expect(result.current.toApi(LanguageCode.GERMAN)).toBe('de');
    });

    test('uses fallback for invalid language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const invalidCode = 'xyz' as LanguageCode;

      expect(result.current.toApi(invalidCode, LanguageCode.ENGLISH)).toBe(
        'en',
      );
      expect(console.warn).toHaveBeenCalledWith(
        '[LanguageAdapter]:',
        `Invalid language code: ${invalidCode}, using fallback: en`,
        `(Invalid language code: ${invalidCode})`,
      );
    });

    test('throws when no fallback is provided', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const invalidCode = 'xyz' as LanguageCode;

      expect(() => result.current.toApi(invalidCode)).toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        '[LanguageAdapter]:',
        expect.stringContaining('Invalid language code'),
        expect.any(String),
      );
    });
  });

  describe('fromApi', () => {
    test('converts valid API language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      expect(result.current.fromApi('en')).toBe(LanguageCode.ENGLISH);
      expect(result.current.fromApi('de')).toBe(LanguageCode.GERMAN);
    });

    test('uses fallback for invalid API codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const invalidCode = 'xyz' as components['schemas']['LanguageCode'];

      expect(result.current.fromApi(invalidCode, LanguageCode.ENGLISH)).toBe(
        LanguageCode.ENGLISH,
      );
      expect(console.warn).toHaveBeenCalledWith(
        '[LanguageAdapter]:',
        expect.stringContaining('Invalid API language code'),
        expect.any(String),
      );
    });

    test('throws when no fallback is provided', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const invalidCode = 'xyz' as components['schemas']['LanguageCode'];

      expect(() => result.current.fromApi(invalidCode)).toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        '[LanguageAdapter]:',
        expect.stringContaining('Invalid API language code'),
        expect.any(String),
      );
    });
  });

  describe('handleApiLanguage', () => {
    test('handles valid API language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      expect(result.current.handleApiLanguage('en')).toBe(LanguageCode.ENGLISH);
    });

    test('returns fallback for non-string values', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const fallback = LanguageCode.ENGLISH;

      expect(result.current.handleApiLanguage(123, fallback)).toBe(fallback);
      expect(result.current.handleApiLanguage(null, fallback)).toBe(fallback);
      expect(result.current.handleApiLanguage(undefined, fallback)).toBe(
        fallback,
      );
      expect(result.current.handleApiLanguage({}, fallback)).toBe(fallback);

      expect(console.warn).toHaveBeenCalledTimes(4);
    });

    test('returns fallback for invalid language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      expect(
        result.current.handleApiLanguage('xyz', LanguageCode.ENGLISH),
      ).toBe(LanguageCode.ENGLISH);
      expect(console.warn).toHaveBeenCalledWith(
        '[LanguageAdapter]:',
        expect.stringContaining('Failed to handle API language'),
        expect.any(String),
      );
    });

    test('returns undefined when no fallback provided', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      expect(result.current.handleApiLanguage('xyz')).toBeUndefined();
    });
  });

  describe('isValid', () => {
    test('validates string language codes', () => {
      const { result } = renderHook(() => useLanguageAdapter());

      // Valid codes
      expect(result.current.isValid('en')).toBe(true);
      expect(result.current.isValid('de')).toBe(true);

      // Invalid codes
      expect(result.current.isValid('xyz')).toBe(false);
      expect(result.current.isValid('')).toBe(false);
    });

    test('rejects non-string values', () => {
      const { result } = renderHook(() => useLanguageAdapter());

      expect(result.current.isValid(123)).toBe(false);
      expect(result.current.isValid(null)).toBe(false);
      expect(result.current.isValid(undefined)).toBe(false);
      expect(result.current.isValid({})).toBe(false);
      expect(result.current.isValid([])).toBe(false);
    });
  });

  describe('options', () => {
    test('suppresses warnings when silent is true', () => {
      const { result } = renderHook(() => useLanguageAdapter({ silent: true }));
      const invalidCode = 'xyz' as LanguageCode;

      result.current.toApi(invalidCode, LanguageCode.ENGLISH);
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('shows warnings by default', () => {
      const { result } = renderHook(() => useLanguageAdapter());
      const invalidCode = 'xyz' as LanguageCode;

      result.current.toApi(invalidCode, LanguageCode.ENGLISH);
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
