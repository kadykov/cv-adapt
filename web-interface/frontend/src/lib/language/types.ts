/**
 * Enum for supported language codes.
 * Must match backend LanguageCode enum.
 */
export enum LanguageCode {
  ENGLISH = 'en',
  FRENCH = 'fr',
  GERMAN = 'de',
  SPANISH = 'es',
  ITALIAN = 'it',
}

/**
 * Interface for language configuration.
 * Matches backend LanguageConfig model.
 */
export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dateFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;
}

/**
 * Interface for language-specific labels.
 * Matches backend LanguageLabels model.
 */
export interface LanguageLabels {
  code: LanguageCode;
  experience: string;
  education: string;
  skills: string;
  coreCompetences: string;
}
