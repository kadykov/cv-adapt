import { client } from '../../../lib/api/client';
import type {
  GeneratedCVCreate,
  GeneratedCVResponse,
  GenerateCVRequest,
  GenerateCompetencesRequest,
} from '../../../lib/api/generated-types';
import { CV_GENERATION_API } from '../constants';

/**
 * Get all generated CVs, optionally filtered by language
 */
export async function getGeneratedCVs(
  language_code = 'en',
): Promise<GeneratedCVResponse[]> {
  return client.get(`${CV_GENERATION_API.BASE}?language_code=${language_code}`);
}

/**
 * Get a single generated CV by ID
 */
export async function getGeneratedCV(id: number): Promise<GeneratedCVResponse> {
  return client.get(`${CV_GENERATION_API.BASE}/${id}`);
}

/**
 * Generate a new CV
 */
export async function generateCV(
  data: GenerateCVRequest,
): Promise<GeneratedCVResponse> {
  return client.post(CV_GENERATION_API.GENERATE, data);
}

/**
 * Generate core competencies for a CV
 */
export async function generateCompetences(
  data: GenerateCompetencesRequest,
): Promise<GeneratedCVResponse> {
  return client.post(CV_GENERATION_API.COMPETENCES, data);
}

/**
 * Update an existing generated CV
 */
export async function updateGeneratedCV(
  id: number,
  data: Partial<GeneratedCVCreate>,
): Promise<GeneratedCVResponse> {
  return client.put(`${CV_GENERATION_API.BASE}/${id}`, data);
}

/**
 * Delete a generated CV
 */
export async function deleteGeneratedCV(id: number): Promise<void> {
  return client.delete(`${CV_GENERATION_API.BASE}/${id}`);
}
