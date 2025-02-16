
import { z } from 'zod';
import { BaseService } from './base-service';
import type { ApiResponse } from '../api-utils';
import { schemas } from '../zod-schemas';

export class DetailedCVService extends BaseService {
  /**
   * Get all user's detailed CVs
   */
  async getAllDetailedCVs(): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>[]>> {
    try {
      const response = await this.client['/user/detailed-cvs'].get();
      return {
        data: this.validate(z.array(schemas.DetailedCVResponse), response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's detailed CV by language
   */
  async getDetailedCVByLanguage(languageCode: string): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code'].get({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create or update user's detailed CV for a language
   */
  async upsertDetailedCV(
    languageCode: string,
    cv: z.infer<typeof schemas.DetailedCVCreate>
  ): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code'].put({
        params: { language_code: languageCode },
        body: cv
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete user's detailed CV by language
   */
  async deleteDetailedCV(languageCode: string): Promise<void> {
    try {
      await this.client['/user/detailed-cvs/:language_code'].delete({
        params: { language_code: languageCode }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Set a CV as primary
   */
  async setPrimaryCv(languageCode: string): Promise<ApiResponse<z.infer<typeof schemas.DetailedCVResponse>>> {
    try {
      const response = await this.client['/user/detailed-cvs/:language_code/primary'].put({
        params: { language_code: languageCode }
      });
      return {
        data: this.validate(schemas.DetailedCVResponse, response),
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
