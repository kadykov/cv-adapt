export interface JobDescriptionCreate {
  title: string;
  description: string;
  language_code: string;
}

export interface JobDescriptionUpdate {
  title?: string | null;
  description?: string | null;
}

export interface JobDescriptionResponse {
  id: number;
  title: string;
  description: string;
  language_code: string;
  created_at: string;
  updated_at: string | null;
}

export type JobsResponse = JobDescriptionResponse[];

export interface ErrorResponse {
  detail: {
    message: string;
    code?: string;
    field?: string;
  };
}
