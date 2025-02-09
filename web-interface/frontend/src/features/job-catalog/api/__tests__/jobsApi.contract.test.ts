import { describe, expect, it } from 'vitest';
import type {
  JobDescriptionResponse,
  JobDescriptionCreate,
  JobDescriptionUpdate
} from '../../../../types/api';

describe('Job Description Type Contracts', () => {
  describe('JobDescriptionResponse', () => {
    it('should validate valid job response', () => {
      const validJob: JobDescriptionResponse = {
        id: 1,
        title: 'Software Engineer',
        description: 'Full stack developer position',
        language_code: 'en',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      // TypeScript compilation is the test - if it compiles, types match
      expect(validJob).toBeDefined();
      expect(validJob.id).toEqual(1);
    });

    it('should catch invalid job response at compile time', () => {
      // @ts-expect-error - missing required fields
      const invalidJob: JobDescriptionResponse = {
        id: 1,
        title: 'Software Engineer',
      };

      // This assertion is just to make vitest happy
      expect(invalidJob).toBeDefined();
    });
  });

  describe('JobDescriptionCreate', () => {
    it('should validate valid job creation data', () => {
      const validCreateData: JobDescriptionCreate = {
        title: 'Software Engineer',
        description: 'Full stack developer position',
        language_code: 'en',
      };

      expect(validCreateData).toBeDefined();
      expect(validCreateData.title).toEqual('Software Engineer');
    });

    it('should catch invalid job creation data at compile time', () => {
      // @ts-expect-error - missing required fields
      const invalidCreateData: JobDescriptionCreate = {
        title: 'Software Engineer',
      };

      expect(invalidCreateData).toBeDefined();
    });
  });

  describe('JobDescriptionUpdate', () => {
    it('should validate valid job update data', () => {
      const validUpdateData: JobDescriptionUpdate = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      expect(validUpdateData).toBeDefined();
      expect(validUpdateData.title).toEqual('Updated Title');
    });

    it('should allow partial updates', () => {
      const partialUpdate: JobDescriptionUpdate = {
        title: 'Updated Title',
      };

      expect(partialUpdate).toBeDefined();
      expect(partialUpdate.description).toBeUndefined();
    });

    it('should allow null values', () => {
      const nullableUpdate: JobDescriptionUpdate = {
        title: null,
        description: null,
      };

      expect(nullableUpdate).toBeDefined();
      expect(nullableUpdate.title).toBeNull();
    });
  });

  describe('Type Compatibility', () => {
    it('should ensure response type includes all create fields', () => {
      const createData: JobDescriptionCreate = {
        title: 'Software Engineer',
        description: 'Full stack developer position',
        language_code: 'en',
      };

      const response: JobDescriptionResponse = {
        ...createData,
        id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      expect(response).toBeDefined();
      expect(response.title).toEqual(createData.title);
    });

    it('should ensure update fields are subset of response', () => {
      const response: JobDescriptionResponse = {
        id: 1,
        title: 'Software Engineer',
        description: 'Full stack developer position',
        language_code: 'en',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      const update: JobDescriptionUpdate = {
        title: response.title,
        description: response.description,
      };

      expect(update).toBeDefined();
      expect(update.title).toEqual(response.title);
    });
  });
});
