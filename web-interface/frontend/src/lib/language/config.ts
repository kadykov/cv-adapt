import { LanguageCode, LanguageConfig, LanguageLabels } from "./types";

/**
 * Language configurations matching backend LanguageConfig registry.
 */
export const LANGUAGE_CONFIG: Record<LanguageCode, LanguageConfig> = {
  [LanguageCode.ENGLISH]: {
    code: LanguageCode.ENGLISH,
    name: "English",
    nativeName: "English",
    dateFormat: "%m/%d/%Y",
    decimalSeparator: ".",
    thousandsSeparator: ",",
  },
  [LanguageCode.FRENCH]: {
    code: LanguageCode.FRENCH,
    name: "French",
    nativeName: "Français",
    dateFormat: "%d/%m/%Y",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
  [LanguageCode.GERMAN]: {
    code: LanguageCode.GERMAN,
    name: "German",
    nativeName: "Deutsch",
    dateFormat: "%d.%m.%Y",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  [LanguageCode.SPANISH]: {
    code: LanguageCode.SPANISH,
    name: "Spanish",
    nativeName: "Español",
    dateFormat: "%d/%m/%Y",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
  [LanguageCode.ITALIAN]: {
    code: LanguageCode.ITALIAN,
    name: "Italian",
    nativeName: "Italiano",
    dateFormat: "%d/%m/%Y",
    decimalSeparator: ",",
    thousandsSeparator: ".",
  },
};

/**
 * Language labels matching backend LanguageLabels registry.
 */
export const LANGUAGE_LABELS: Record<LanguageCode, LanguageLabels> = {
  [LanguageCode.ENGLISH]: {
    code: LanguageCode.ENGLISH,
    experience: "Professional Experience",
    education: "Education",
    skills: "Skills",
    coreCompetences: "Core Competences",
  },
  [LanguageCode.FRENCH]: {
    code: LanguageCode.FRENCH,
    experience: "Expérience Professionnelle",
    education: "Formation",
    skills: "Compétences",
    coreCompetences: "Compétences Clés",
  },
  [LanguageCode.GERMAN]: {
    code: LanguageCode.GERMAN,
    experience: "Berufserfahrung",
    education: "Ausbildung",
    skills: "Fähigkeiten",
    coreCompetences: "Kernkompetenzen",
  },
  [LanguageCode.SPANISH]: {
    code: LanguageCode.SPANISH,
    experience: "Experiencia Profesional",
    education: "Educación",
    skills: "Habilidades",
    coreCompetences: "Competencias Principales",
  },
  [LanguageCode.ITALIAN]: {
    code: LanguageCode.ITALIAN,
    experience: "Esperienza Professionale",
    education: "Istruzione",
    skills: "Competenze",
    coreCompetences: "Competenze Chiave",
  },
};

/**
 * Get an array of all supported languages with labels for UI display.
 */
export function getLanguageOptions(): Array<{ value: LanguageCode; label: string }> {
  return Object.values(LANGUAGE_CONFIG).map(lang => ({
    value: lang.code,
    label: `${lang.name} (${lang.nativeName})`,
  }));
}

/**
 * Get configuration for a specific language code.
 * @throws Error if language code is not supported
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  const config = LANGUAGE_CONFIG[code];
  if (!config) {
    throw new Error(`Language configuration not found for code: ${code}`);
  }
  return config;
}

/**
 * Get labels for a specific language code.
 * @throws Error if language code is not supported
 */
export function getLanguageLabels(code: LanguageCode): LanguageLabels {
  const labels = LANGUAGE_LABELS[code];
  if (!labels) {
    throw new Error(`Language labels not found for code: ${code}`);
  }
  return labels;
}
