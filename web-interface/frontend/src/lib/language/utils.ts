import { format } from 'date-fns';
import { getLanguageConfig } from './config';
import { LanguageCode } from './types';

/**
 * Format a date according to language configuration.
 * @param date The date to format
 * @param languageCode The language code to use for formatting
 */
export function formatDate(date: Date, languageCode: LanguageCode): string {
  const config = getLanguageConfig(languageCode);
  // Convert Python strftime format to date-fns format
  const formatStr =
    config.dateFormat
      ?.replace('%d', 'dd')
      .replace('%m', 'MM')
      .replace('%Y', 'yyyy') ?? 'MM/dd/yyyy';
  return format(date, formatStr);
}

/**
 * Format a number according to language configuration.
 * @param num The number to format
 * @param languageCode The language code to use for formatting
 */
export function formatNumber(num: number, languageCode: LanguageCode): string {
  const config = getLanguageConfig(languageCode);
  // Format with explicit separator configuration
  const parts = Math.abs(num).toString().split('.');
  const wholeNum = parts[0];
  const decimals = parts[1] || '00';

  // Format the whole number part with thousands separator
  const formatted = wholeNum
    .split('')
    .reverse()
    .reduce((acc, digit, i) => {
      const shouldAddSeparator = i > 0 && i % 3 === 0;
      return shouldAddSeparator
        ? digit + (config.thousandsSeparator ?? ',') + acc
        : digit + acc;
    }, '');

  // Combine with decimal part using appropriate separator
  return `${num < 0 ? '-' : ''}${formatted}${config.decimalSeparator ?? '.'}${decimals.padEnd(2, '0')}`;
}

/**
 * Validate if a language code is supported.
 * @param code The language code to validate
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return Object.values(LanguageCode).includes(code as LanguageCode);
}

/**
 * Get the default language code for the application.
 */
export function getDefaultLanguageCode(): LanguageCode {
  // Use browser language if it's supported, fallback to English
  const browserLang = navigator.language.split('-')[0];
  return isValidLanguageCode(browserLang)
    ? (browserLang as LanguageCode)
    : LanguageCode.ENGLISH;
}
