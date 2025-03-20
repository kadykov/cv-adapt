import type { components } from '@/lib/api/generated-types';
import { LanguageCode } from './types';
import { isValidLanguageCode } from './utils';

/**
 * Converts our local LanguageCode enum to API schema type.
 * This provides compile-time safety while maintaining runtime compatibility.
 *
 * @throws {Error} If the language code is invalid
 */
export const toApiLanguage = (
  language: LanguageCode,
): components['schemas']['LanguageCode'] => {
  if (!isValidLanguageCode(language)) {
    throw new Error(`Invalid language code: ${language}`);
  }
  return language;
};

/**
 * Converts API schema language code to our local enum.
 * Use this when receiving data from the API.
 *
 * @throws {Error} If the language code is invalid
 */
export const fromApiLanguage = (
  apiLanguage: components['schemas']['LanguageCode'],
): LanguageCode => {
  if (!isValidLanguageCode(apiLanguage)) {
    throw new Error(`Invalid API language code: ${apiLanguage}`);
  }
  return apiLanguage as LanguageCode;
};
