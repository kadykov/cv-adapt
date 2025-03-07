/**
 * API functions for the Detailed CV feature
 */
import { DetailedCVResponse } from '../../../lib/api/generated-types';
import { mapFormToApiRequest } from '../types/detailed-cv';
import type { DetailedCVFormData } from '../types/detailed-cv';
import { client } from '../../../lib/api/client';
import { LanguageCode } from '../../../lib/language/types';

/**
 * Get all detailed CVs for the current user
 */
export async function getDetailedCVs(): Promise<DetailedCVResponse[]> {
  return client.get<DetailedCVResponse[]>('/user/detailed-cvs');
}

/**
 * Get a detailed CV by language code
 */
export async function getDetailedCV(
  languageCode: LanguageCode | undefined,
): Promise<DetailedCVResponse> {
  if (!languageCode) {
    throw new Error('Language code is required');
  }
  return client.get<DetailedCVResponse>(`/user/detailed-cvs/${languageCode}`);
}

/**
 * Create or update a detailed CV
 */
export async function upsertDetailedCV(
  languageCode: LanguageCode,
  data: DetailedCVFormData,
): Promise<DetailedCVResponse> {
  return client.put<DetailedCVResponse>(
    `/user/detailed-cvs/${languageCode}`,
    mapFormToApiRequest(data),
  );
}

/**
 * Delete a detailed CV
 */
export async function deleteDetailedCV(
  languageCode: LanguageCode,
): Promise<void> {
  return client.delete(`/user/detailed-cvs/${languageCode}`);
}

/**
 * Set a detailed CV as primary
 */
export async function setPrimaryCV(
  languageCode: LanguageCode,
): Promise<DetailedCVResponse> {
  return client.put<DetailedCVResponse>(
    `/user/detailed-cvs/${languageCode}/primary`,
    {},
  );
}
