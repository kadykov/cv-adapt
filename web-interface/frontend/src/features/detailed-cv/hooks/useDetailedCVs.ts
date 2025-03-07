/**
 * React Query hooks for fetching detailed CVs
 */
import { useQuery } from '@tanstack/react-query';
import { getDetailedCVs, getDetailedCV } from '../api/detailedCVApi';
import type { DetailedCVResponse } from '../types/detailed-cv';
import { LanguageCode } from '../../../lib/language/types';

// Query keys
export const detailedCVKeys = {
  all: ['detailed-cvs'] as const,
  lists: () => [...detailedCVKeys.all, 'list'] as const,
  list: (filters: { language?: LanguageCode } = {}) =>
    [...detailedCVKeys.lists(), filters] as const,
  details: () => [...detailedCVKeys.all, 'detail'] as const,
  detail: (languageCode: LanguageCode | undefined) =>
    languageCode
      ? ([...detailedCVKeys.details(), languageCode] as const)
      : ([...detailedCVKeys.details(), 'undefined'] as const),
};

/**
 * Hook for fetching all detailed CVs
 */
export function useDetailedCVs(options = {}) {
  return useQuery({
    queryKey: detailedCVKeys.lists(),
    queryFn: getDetailedCVs,
    ...options,
  });
}

/**
 * Hook for fetching a specific detailed CV by language code
 */
export function useDetailedCV(
  languageCode: LanguageCode | undefined,
  options = {},
) {
  return useQuery({
    queryKey: detailedCVKeys.detail(languageCode),
    queryFn: () => getDetailedCV(languageCode),
    enabled: !!languageCode,
    ...options,
  });
}

/**
 * Get available languages that don't have a CV yet
 */
export function getAvailableLanguages(cvs: DetailedCVResponse[]) {
  const usedLanguages = new Set(cvs.map((cv) => cv.language_code));
  return Object.values(LanguageCode).filter((code) => !usedLanguages.has(code));
}

/**
 * Get the primary CV from a list of detailed CVs
 */
export function getPrimaryCV(
  cvs: DetailedCVResponse[],
): DetailedCVResponse | undefined {
  return cvs.find((cv) => cv.is_primary);
}
