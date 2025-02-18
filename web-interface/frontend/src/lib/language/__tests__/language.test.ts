import { describe, expect, it } from "vitest";
import { LanguageCode } from "../types";
import { LANGUAGE_CONFIG, LANGUAGE_LABELS, getLanguageConfig, getLanguageLabels } from "../config";
import { formatDate, formatNumber, isValidLanguageCode, getDefaultLanguageCode } from "../utils";

describe("Language System", () => {
  describe("Language Configuration", () => {
    it("should have configurations for all language codes", () => {
      Object.values(LanguageCode).forEach(code => {
        expect(LANGUAGE_CONFIG[code]).toBeDefined();
        expect(LANGUAGE_CONFIG[code].name).toBeDefined();
        expect(LANGUAGE_CONFIG[code].nativeName).toBeDefined();
      });
    });

    it("should have labels for all language codes", () => {
      Object.values(LanguageCode).forEach(code => {
        expect(LANGUAGE_LABELS[code]).toBeDefined();
        expect(LANGUAGE_LABELS[code].experience).toBeDefined();
        expect(LANGUAGE_LABELS[code].education).toBeDefined();
        expect(LANGUAGE_LABELS[code].skills).toBeDefined();
        expect(LANGUAGE_LABELS[code].coreCompetences).toBeDefined();
      });
    });

    it("should throw error for invalid language code in getLanguageConfig", () => {
      expect(() => getLanguageConfig("invalid" as LanguageCode)).toThrow();
    });

    it("should throw error for invalid language code in getLanguageLabels", () => {
      expect(() => getLanguageLabels("invalid" as LanguageCode)).toThrow();
    });
  });

  describe("Language Utilities", () => {
    it("should format dates according to language configuration", () => {
      const date = new Date("2024-02-18");

      expect(formatDate(date, LanguageCode.ENGLISH)).toBe("02/18/2024");
      expect(formatDate(date, LanguageCode.FRENCH)).toBe("18/02/2024");
      expect(formatDate(date, LanguageCode.GERMAN)).toBe("18.02.2024");
    });

    it("should format numbers consistently across languages", () => {
      const number = 1234.56;

      const assertFormat = (output: string) => {
        // Strip all separators and verify digits
        const digits = output.replace(/[,.\s]/g, "");
        expect(digits).toBe("123456");

        // Verify basic number structure (1 then 234 then 56)
        expect(output).toMatch(/1.*234.*56/);

        // Verify separators are present
        const separators = output.replace(/[0-9]/g, "");
        expect(separators.length).toBe(2); // Should have 2 separators
      };

      assertFormat(formatNumber(number, LanguageCode.ENGLISH));
      assertFormat(formatNumber(number, LanguageCode.FRENCH));
      assertFormat(formatNumber(number, LanguageCode.GERMAN));
    });

    it("should validate language codes", () => {
      expect(isValidLanguageCode("en")).toBe(true);
      expect(isValidLanguageCode("fr")).toBe(true);
      expect(isValidLanguageCode("invalid")).toBe(false);
      expect(isValidLanguageCode("")).toBe(false);
    });

    it("should provide default language code", () => {
      const defaultCode = getDefaultLanguageCode();
      expect(Object.values(LanguageCode)).toContain(defaultCode);
    });
  });
});
