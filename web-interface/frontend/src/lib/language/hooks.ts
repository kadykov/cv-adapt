import { useCallback, useState, useRef } from 'react';
import { toApiLanguage, fromApiLanguage } from './adapters';
import { LanguageCode } from './types';
import type { components } from '@/lib/api/generated-types';

export interface UseLanguageAdapterOptions {
  initialValue?: LanguageCode;
  silent?: boolean;
}

export interface UseLanguageAdapterResult {
  /**
   * Current language value
   */
  value: LanguageCode;

  /**
   * Set the language value with race condition protection
   */
  setValue: (input: string, api: {
    setLanguage: (
      lang: components['schemas']['LanguageCode']
    ) => Promise<components['schemas']['LanguageCode']>;
  }) => Promise<void>;

  /**
   * Convert our internal LanguageCode to API format.
   * Logs warning and returns fallback if language code is invalid.
   */
  toApi: (
    language: LanguageCode,
    fallback?: LanguageCode,
  ) => components['schemas']['LanguageCode'];

  /**
   * Convert API language code to our internal enum.
   * Logs warning and returns fallback if language code is invalid.
   */
  fromApi: (
    apiLanguage: components['schemas']['LanguageCode'],
    fallback?: LanguageCode,
  ) => LanguageCode;

  /**
   * Handle API response with language code safely.
   * Returns undefined if language code is invalid.
   */
  handleApiLanguage: (
    apiLanguage: unknown,
    fallback?: LanguageCode,
  ) => LanguageCode | undefined;

  /**
   * Check if a language code is valid.
   */
  isValid: (language: unknown) => boolean;
}

/**
 * Hook for safely handling language code conversions in components.
 * Provides error handling, fallbacks, and validation.
 *
 * @example
 * ```tsx
 * function LanguageSelector({ value, onChange }: Props) {
 *   const { toApi, handleApiLanguage, isValid } = useLanguageAdapter();
 *
 *   const handleSelect = (input: string) => {
 *     if (!isValid(input)) {
 *       showError('Invalid language selected');
 *       return;
 *     }
 *     const language = handleApiLanguage(input, LanguageCode.ENGLISH);
 *     if (language) {
 *       onChange(language);
 *       api.setLanguage(toApi(language));
 *     }
 *   };
 *
 *   return <select value={value} onChange={e => handleSelect(e.target.value)} />;
 * }
 * ```
 *
 * @param options.silent - Suppress warning logs (default: false)
 */
export function useLanguageAdapter({
  initialValue = LanguageCode.ENGLISH,
  silent = false,
}: UseLanguageAdapterOptions = {}): UseLanguageAdapterResult {
  const [value, setValue] = useState<LanguageCode>(initialValue);
  const latestRequestRef = useRef<number>(0);
  const logWarning = useCallback(
    (message: string, error?: Error) => {
      if (!silent) {
        console.warn(
          '[LanguageAdapter]:',
          message,
          error ? `(${error.message})` : '',
        );
      }
    },
    [silent],
  );

  const isValid = useCallback((language: unknown): boolean => {
    if (typeof language !== 'string') {
      return false;
    }
    try {
      toApiLanguage(language as LanguageCode);
      return true;
    } catch {
      return false;
    }
  }, []);

  const toApi = useCallback(
    (
      language: LanguageCode,
      fallback?: LanguageCode,
    ): components['schemas']['LanguageCode'] => {
      try {
        return toApiLanguage(language);
      } catch (error) {
        logWarning(
          `Invalid language code: ${language}${fallback ? `, using fallback: ${toApiLanguage(fallback)}` : ''}`,
          error as Error,
        );
        if (fallback) {
          return toApiLanguage(fallback);
        }
        throw error;
      }
    },
    [logWarning],
  );

  const fromApi = useCallback(
    (
      apiLanguage: components['schemas']['LanguageCode'],
      fallback?: LanguageCode,
    ): LanguageCode => {
      try {
        return fromApiLanguage(apiLanguage);
      } catch (error) {
        logWarning(
          `Invalid API language code: ${apiLanguage}${fallback ? `, using fallback: ${fallback}` : ''}`,
          error as Error,
        );
        if (fallback) {
          return fallback;
        }
        throw error;
      }
    },
    [logWarning],
  );

  const handleApiLanguage = useCallback(
    (
      apiLanguage: unknown,
      fallback?: LanguageCode,
    ): LanguageCode | undefined => {
      if (typeof apiLanguage !== 'string') {
        logWarning(`Invalid API language type: ${typeof apiLanguage}`);
        return fallback;
      }

      try {
        return fromApiLanguage(
          apiLanguage as components['schemas']['LanguageCode'],
        );
      } catch (error) {
        logWarning(
          `Failed to handle API language: ${apiLanguage}`,
          error as Error,
        );
        return fallback;
      }
    },
    [logWarning],
  );

  const handleSetValue = useCallback(async (
    input: string,
    api: {
      setLanguage: (
        lang: components['schemas']['LanguageCode']
      ) => Promise<components['schemas']['LanguageCode']>;
    }
  ) => {
    if (!isValid(input)) return;

    const requestId = Date.now();
    latestRequestRef.current = requestId;

    const requestedLanguage = handleApiLanguage(input, value);
    if (requestedLanguage) {
      try {
        const result = await api.setLanguage(toApi(requestedLanguage));
        // Only update if this is still the latest request and language matches
        if (requestId === latestRequestRef.current && result === toApi(requestedLanguage)) {
          setValue(requestedLanguage);
        }
      } catch {
        // Error handling omitted for brevity
      }
    }
  }, [isValid, handleApiLanguage, value, toApi]);

  return {
    toApi,
    fromApi,
    handleApiLanguage,
    isValid,
    value,
    setValue: handleSetValue,
  };
}
