export interface BaseJob {
  title: string;
  description: string;
  requirements: string[];
  language_code: string;
}

export interface JobDescriptionResponse extends BaseJob {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface JobDescriptionCreate extends Omit<BaseJob, 'requirements'> {
  requirements?: string[];
}

export interface JobDescriptionUpdate extends Partial<BaseJob> {}

export type Title3 = string | null;
