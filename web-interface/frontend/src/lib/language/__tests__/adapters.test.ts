import { describe, test, expect } from 'vitest';
import { toApiLanguage, fromApiLanguage } from '../adapters';
import { LanguageCode } from '../types';
import type { components } from '@/lib/api/generated-types';

describe('Language Adapters', () => {
  describe('toApiLanguage', () => {
    test.each(Object.values(LanguageCode))(
      'converts valid language code: %s',
      (code) => {
        const result = toApiLanguage(code);
        expect(result).toBe(code);
      },
    );

    test('throws error for invalid language code', () => {
      const invalidCode = 'xyz' as LanguageCode;
      expect(() => toApiLanguage(invalidCode)).toThrow('Invalid language code');
    });

    test('maintains type compatibility with API schema', () => {
      const apiLanguage: components['schemas']['LanguageCode'] = toApiLanguage(
        LanguageCode.ENGLISH,
      );
      expect(apiLanguage).toBe('en');
    });
  });

  describe('fromApiLanguage', () => {
    const validApiCodes: components['schemas']['LanguageCode'][] = [
      'en',
      'de',
      'fr',
      'es',
      'it',
    ];

    test.each(validApiCodes)('converts valid API language code: %s', (code) => {
      const result = fromApiLanguage(code);
      expect(result).toBe(code);
      // Verify it's a valid enum value
      expect(Object.values(LanguageCode)).toContain(result);
    });

    test('throws error for invalid API language code', () => {
      const invalidCode = 'xyz' as components['schemas']['LanguageCode'];
      expect(() => fromApiLanguage(invalidCode)).toThrow(
        'Invalid API language code',
      );
    });

    test('maintains our enum type', () => {
      const localLanguage: LanguageCode = fromApiLanguage('en');
      expect(localLanguage).toBe(LanguageCode.ENGLISH);
    });
  });

  describe('bidirectional conversion', () => {
    test.each(Object.values(LanguageCode))(
      'preserves language code through round trip: %s',
      (code) => {
        const apiCode = toApiLanguage(code);
        const roundTrip = fromApiLanguage(apiCode);
        expect(roundTrip).toBe(code);
      },
    );
  });

  describe('type compatibility', () => {
    test('toApiLanguage accepts LanguageCode enum values', () => {
      // Valid - using enum value
      const validInput = LanguageCode.ENGLISH;
      expect(() => toApiLanguage(validInput)).not.toThrow();

      // Valid - type coercion for known values
      const coercedInput = 'en' as LanguageCode;
      expect(() => toApiLanguage(coercedInput)).not.toThrow();

      // Invalid - runtime error for unknown values
      const invalidInput = 'invalid' as LanguageCode;
      expect(() => toApiLanguage(invalidInput)).toThrow();
    });

    test('fromApiLanguage accepts API schema values', () => {
      // Valid - using string literal type
      const validInput: components['schemas']['LanguageCode'] = 'en';
      expect(() => fromApiLanguage(validInput)).not.toThrow();

      // Valid - using known value
      expect(() => fromApiLanguage('de')).not.toThrow();

      // Invalid - runtime error for unknown values
      const invalidInput = 'invalid' as components['schemas']['LanguageCode'];
      expect(() => fromApiLanguage(invalidInput)).toThrow();
    });

    test('output types are correct', () => {
      // toApiLanguage output is compatible with API schema
      const apiOutput: components['schemas']['LanguageCode'] = toApiLanguage(
        LanguageCode.ENGLISH,
      );
      expect(apiOutput).toBe('en');

      // fromApiLanguage output is compatible with our enum
      const enumOutput: LanguageCode = fromApiLanguage('en');
      expect(enumOutput).toBe(LanguageCode.ENGLISH);
    });
  });
});
