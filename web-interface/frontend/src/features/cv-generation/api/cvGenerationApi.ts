import { client } from '../../../lib/api/client';
import type { components } from '../../../lib/api/types';
import { CV_GENERATION_API } from '../constants';

type Schema = components['schemas'];

/**
 * Get all generated CVs, optionally filtered and paginated
 */
export async function getGeneratedCVs(params?: {
  language_code?: string;
  offset?: number;
  limit?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Schema['PaginatedResponse_GeneratedCVResponse_']> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  return client.get(`${CV_GENERATION_API.BASE}?${searchParams.toString()}`);
}

/**
 * Get a single generated CV by ID
 */
export async function getGeneratedCV(id: number): Promise<Schema['GeneratedCVResponse']> {
  return client.get(`${CV_GENERATION_API.BASE}/${id}`);
}

/**
 * Generate core competences from CV and job description
 */
export async function generateCompetences(
  data: Schema['GenerateCompetencesRequest'],
  language_code = 'en'
): Promise<Schema['CoreCompetencesResponse']> {
  return client.post(`${CV_GENERATION_API.COMPETENCES}?language_code=${language_code}`, data);
}

/**
 * Generate a full CV using competences
 */
export async function generateCV(
  data: Schema['GenerateCVRequest'],
  language_code = 'en'
): Promise<Schema['CVDTO']> {
  return client.post(`${CV_GENERATION_API.GENERATE}?language_code=${language_code}`, data);
}

/**
 * Generate and store a new CV
 */
export async function generateAndSaveCV(
  data: Schema['GeneratedCVCreate']
): Promise<Schema['GeneratedCVDirectResponse']> {
  return client.post(CV_GENERATION_API.BASE, data);
}

/**
 * Get generation status for a CV
 */
export async function getGenerationStatus(id: number): Promise<Schema['GenerationStatusResponse']> {
  const url = CV_GENERATION_API.STATUS.replace(':id', id.toString());
  return client.get(url);
}

/**
 * Update an existing generated CV (status or parameters)
 */
export async function updateGeneratedCV(
  id: number,
  data: Schema['GeneratedCVUpdate']
): Promise<Schema['GeneratedCVResponse']> {
  return client.patch(`${CV_GENERATION_API.BASE}/${id}`, data);
}

/**
 * Delete a generated CV
 */
export async function deleteGeneratedCV(id: number): Promise<void> {
  return client.delete(`${CV_GENERATION_API.BASE}/${id}`);
}

/**
 * Export a generated CV in a specific format
 */
export async function exportGeneratedCV(
  id: number,
  format: Schema['LanguageCode']
): Promise<Blob> {
  return client.get(
    `${CV_GENERATION_API.BASE}/${id}/export?format=${format}`,
    { responseType: 'blob' }
  );
}
